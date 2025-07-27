// =============================================================================
// src/app/api/chat/route.ts - FIXED WITH PROPER MODEL MANAGEMENT
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// Import organized modules
import { TOOLS_OPENAI } from './lib/constants';
import { isSchedulingRequest, getErrorMessage } from './lib/utils';
import { createSystemPrompt, DEFAULT_TIMEZONE, parseUserTimeInputToISO, ChatCompletionMessage } from './lib/timezone';
import { handleScheduleEvent } from './lib/scheduling';
import { getOrCreateConversation, getConversationHistory, saveMessage } from './lib/conversation';
import { ScheduleEventArgs } from './lib/types';

// UPDATED IMPORTS FOR MODEL MANAGEMENT
import { modelAwareRateLimiter } from './lib/rate-limiter';

// GitHub AI Models endpoint
const githubAiEndpoint = "https://models.github.ai/inference";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // CHECK RATE LIMIT AND GET SELECTED MODEL
    const rateLimitResult = await modelAwareRateLimiter.checkRateLimit(userId);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: rateLimitResult.message,
        modelSummary: rateLimitResult.modelSummary,
        nextAvailableAt: rateLimitResult.nextAvailableAt?.toISOString(),
        resetTime: rateLimitResult.resetTime.toISOString(),
        // Enhanced error response for better UX
        availableModels: rateLimitResult.modelSummary?.availableModels || [],
        allModelsExhausted: rateLimitResult.modelSummary?.allModelsExhausted || true
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString(),
          'X-Next-Available': rateLimitResult.nextAvailableAt ? Math.floor(rateLimitResult.nextAvailableAt.getTime() / 1000).toString() : '',
          'Retry-After': rateLimitResult.nextAvailableAt ? Math.ceil((rateLimitResult.nextAvailableAt.getTime() - Date.now()) / 1000).toString() : '86400',
        }
      });
    }

    // FIXED: Ensure selectedModel exists
    if (!rateLimitResult.selectedModel) {
      return NextResponse.json({
        error: 'No model available',
        message: 'System error: No model was selected despite rate limit check passing'
      }, { status: 500 });
    }

    const selectedModel = rateLimitResult.selectedModel;
    console.log(`Using model: ${selectedModel.name} (${selectedModel.displayName})`);

    // Check if GITHUB_TOKEN exists
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json({
        error: 'GitHub Token not configured. Please add GITHUB_TOKEN to your environment variables.'
      }, { status: 500 });
    }

    // Initialize the GitHub AI Model Client
    const client = ModelClient(
      githubAiEndpoint,
      new AzureKeyCredential(process.env.GITHUB_TOKEN),
    );

    const { conversationId, userMessage, userTimeZone } = await req.json();

    // Validate required fields
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
      return NextResponse.json({
        error: 'Message is required and cannot be empty'
      }, { status: 400 });
    }

    // Determine the active timezone for this user/request
    const activeUserTimeZone = userTimeZone || DEFAULT_TIMEZONE;

    const currentConversationId = await getOrCreateConversation(conversationId, userId, userMessage);
    const history = await getConversationHistory(currentConversationId);
    await saveMessage(currentConversationId, 'user', userMessage);

    const shouldSchedule = isSchedulingRequest(userMessage);

    // Create system prompt
    const systemPrompt = createSystemPrompt(activeUserTimeZone);

    // Format messages for the GitHub AI Model API
    const messagesForApi: ChatCompletionMessage[] = [
      systemPrompt,
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content || '',
      })),
      { role: 'user' as const, content: userMessage }
    ];

    // Prepare GitHub AI Model request body with DYNAMIC MODEL
    const requestBody: any = {
      model: selectedModel.name, // DYNAMIC MODEL SELECTION
      messages: messagesForApi,
      temperature: 0.7,
      max_tokens: 1000
    };

    if (shouldSchedule) {
      requestBody.tools = TOOLS_OPENAI;
      requestBody.tool_choice = 'auto';
    }

    // Call GitHub AI Model API
    const response = await client.path("/chat/completions").post({
      body: requestBody
    });

    if (isUnexpected(response)) {
      console.error(`${selectedModel.name} API error:`, response.body.error);
      
      // Enhanced error handling
      if (response.status === '401') {
        return NextResponse.json({
          error: 'Invalid GitHub Token. Please check your GITHUB_TOKEN environment variable.'
        }, { status: 500 });
      } else if (response.status === '429') {
        return NextResponse.json({
          error: `${selectedModel.displayName} rate limit exceeded. Please try again in a moment.`
        }, { status: 429 });
      } else if (response.status === '404') {
        return NextResponse.json({
          error: `Model ${selectedModel.displayName} not found. The model may not be available.`
        }, { status: 404 });
      }
      
      const httpStatus = parseInt(response.status) || 500;
      return NextResponse.json({
        error: `${selectedModel.displayName} API error: ${response.body.error?.message || 'Unknown error'}`
      }, { status: httpStatus });
    }

    const message = response.body.choices[0]?.message;

    if (!message) {
      return NextResponse.json({
        error: `${selectedModel.displayName} returned no response. Please try again.`
      }, { status: 500 });
    }

    let aiResponse: string;
    const toolCalls = message?.tool_calls;

    // Handle tool calls (scheduling)
    if (toolCalls && toolCalls.length > 0 && shouldSchedule) {
      const toolCall = toolCalls[0];
      if (toolCall.function?.name === 'create_schedule_event') {
        try {
          const toolArguments = JSON.parse(toolCall.function.arguments) as ScheduleEventArgs;

          const eventTimeZone = toolArguments.timeZone || activeUserTimeZone;

          let finalStartTime: string = toolArguments.startTime;
          if (!finalStartTime.includes('T')) {
            const parsedTime = parseUserTimeInputToISO(toolArguments.startTime, eventTimeZone);
            if (parsedTime === null) {
              aiResponse = "I couldn't understand the start time you provided for scheduling. Please be more specific (e.g., 'tomorrow at 2 PM').";
              await saveMessage(currentConversationId, 'assistant', aiResponse);
              return NextResponse.json({
                reply: aiResponse,
                conversationId: currentConversationId,
                processingTime: Date.now() - startTime,
                provider: `GitHub AI Models (${selectedModel.displayName})`,
                modelInfo: {
                  name: selectedModel.name,
                  displayName: selectedModel.displayName,
                  cost: selectedModel.cost
                }
              });
            }
            finalStartTime = parsedTime;
          }

          let finalEndTime: string | undefined = toolArguments.endTime;
          if (finalEndTime && !finalEndTime.includes('T')) {
            const parsedEndTime = parseUserTimeInputToISO(finalEndTime, eventTimeZone);
            if (parsedEndTime !== null) {
              finalEndTime = parsedEndTime;
            }
          }

          aiResponse = await handleScheduleEvent({
            userId,
            conversationId: currentConversationId,
            ...toolArguments,
            startTime: finalStartTime,
            endTime: finalEndTime,
            timeZone: eventTimeZone,
          });
        } catch (parseError) {
          console.error('Error parsing tool arguments:', parseError);
          aiResponse = message?.content || "I had trouble processing your scheduling request. Could you please rephrase it?";
        }
      } else {
        aiResponse = message?.content || "I didn't understand that scheduling request. Could you rephrase?";
      }
    } else {
      aiResponse = message?.content || "I didn't understand that. Could you rephrase?";
    }

    // Validate AI response
    if (!aiResponse || aiResponse.trim() === '') {
      aiResponse = "I'm sorry, I couldn't generate a proper response. Please try asking again.";
    }

    await saveMessage(currentConversationId, 'assistant', aiResponse);

    // INCREMENT USAGE FOR THE SPECIFIC MODEL - This is crucial for the cooldown system
    await modelAwareRateLimiter.incrementUsage(userId, selectedModel.name);

    // Get updated usage stats for response headers
    const usageStats = await modelAwareRateLimiter.getUserUsageStats(userId);

    return NextResponse.json({
      reply: aiResponse,
      conversationId: currentConversationId,
      processingTime: Date.now() - startTime,
      provider: `GitHub AI Models (${selectedModel.displayName})`,
      modelInfo: {
        name: selectedModel.name,
        displayName: selectedModel.displayName,
        cost: selectedModel.cost,
        dailyLimit: selectedModel.dailyLimit,
        priority: selectedModel.priority
      },
      usage: {
        totalRequestsToday: usageStats.totalRequestsToday,
        currentModel: usageStats.currentModel,
        availableModels: usageStats.availableModels,
        resetTime: usageStats.resetTime.toISOString(),
        nextAvailableAt: usageStats.nextAvailableAt?.toISOString(),
        allModelsExhausted: usageStats.allModelsExhausted
      }
    }, {
      headers: {
        'X-Current-Model': selectedModel.displayName,
        'X-Model-Cost': selectedModel.cost,
        'X-Total-Requests': usageStats.totalRequestsToday.toString(),
        'X-Available-Models': usageStats.availableModels.filter(m => !m.inCooldown && m.remaining > 0).length.toString(),
        'X-RateLimit-Reset': Math.floor(usageStats.resetTime.getTime() / 1000).toString(),
      }
    });
    
  } catch (error: unknown) {
    console.error('Chat route error:', getErrorMessage(error));

    // Enhanced error response with more context
    const errorMessage = getErrorMessage(error);
    const isRateLimitError = errorMessage.includes('rate limit') || errorMessage.includes('429');
    const isAuthError = errorMessage.includes('401') || errorMessage.includes('unauthorized');
    
    let userFriendlyMessage = 'Sorry, something went wrong. Please try again.';
    let statusCode = 500;

    if (isRateLimitError) {
      userFriendlyMessage = 'The AI service is currently busy. Please wait a moment and try again.';
      statusCode = 429;
    } else if (isAuthError) {
      userFriendlyMessage = 'There was an authentication issue with the AI service. Please try again.';
      statusCode = 401;
    }

    return NextResponse.json({
      error: userFriendlyMessage,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}