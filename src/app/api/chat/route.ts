// =============================================================================
// src/app/api/chat/route.ts - UPDATED WITH RATE LIMITING
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// NEW IMPORTS FOR GITHUB AI MODELS
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// Import our organized modules
import { TOOLS_OPENAI } from './lib/constants';
import { isSchedulingRequest, getErrorMessage } from './lib/utils';
import { createSystemPrompt, DEFAULT_TIMEZONE, parseUserTimeInputToISO, ChatCompletionMessage } from './lib/timezone';
import { handleScheduleEvent } from './lib/scheduling';
import { getOrCreateConversation, getConversationHistory, saveMessage } from './lib/conversation';
import { ScheduleEventArgs } from './lib/types';

// NEW IMPORT FOR RATE LIMITING
import { rateLimiter } from './lib/rate-limiter';

// Initialize ModelClient for GitHub AI Models
const githubAiEndpoint = "https://models.github.ai/inference";
const githubAiModel = "openai/gpt-4.1";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // CHECK RATE LIMIT BEFORE PROCESSING
    const rateLimitResult = await rateLimiter.checkRateLimit(userId);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: rateLimitResult.message,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime.toISOString(),
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000).toString(),
        }
      });
    }

    // Check if GITHUB_TOKEN exists
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json({
        error: 'GitHub Token not configured. Please add GITHUB_TOKEN to your environment variables.'
      }, { status: 500 });
    }

    // Initialize the GitHub AI Model Client inside the request handler
    const client = ModelClient(
      githubAiEndpoint,
      new AzureKeyCredential(process.env.GITHUB_TOKEN),
    );

    const { conversationId, userMessage, userTimeZone } = await req.json();

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

    // Prepare GitHub AI Model request body
    const requestBody: any = {
      model: githubAiModel,
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
      console.error("GitHub AI Model API error:", response.body.error);
      if (response.status === '401') {
        return NextResponse.json({
          error: 'Invalid GitHub Token. Please check your GITHUB_TOKEN environment variable.'
        }, { status: 500 });
      } else if (response.status === '429') {
        return NextResponse.json({
          error: 'GitHub AI Model rate limit exceeded. Please try again in a moment.'
        }, { status: 429 });
      }
      const httpStatus = parseInt(response.status) || 500;
      return NextResponse.json({
        error: `GitHub AI Model API error: ${response.body.error?.message || 'Unknown error'}`
      }, { status: httpStatus });
    }

    const message = response.body.choices[0]?.message;

    let aiResponse: string;
    const toolCalls = message?.tool_calls;

    // Handle tool calls (scheduling)
    if (toolCalls && toolCalls.length > 0 && shouldSchedule) {
      const toolCall = toolCalls[0];
      if (toolCall.function?.name === 'create_schedule_event') {
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
              processingTime: Date.now() - startTime
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
      } else {
        aiResponse = message?.content || "I didn't understand that. Could you rephrase?";
      }
    } else {
      aiResponse = message?.content || "I didn't understand that. Could you rephrase?";
    }

    await saveMessage(currentConversationId, 'assistant', aiResponse);

    // INCREMENT USAGE AFTER SUCCESSFUL REQUEST
    await rateLimiter.incrementUsage(userId);

    // Get updated usage stats for response headers
    const usageStats = await rateLimiter.getUserUsageStats(userId);

    return NextResponse.json({
      reply: aiResponse,
      conversationId: currentConversationId,
      processingTime: Date.now() - startTime,
      provider: 'GitHub AI Models (OpenAI GPT-4.1)',
      usage: {
        requests_today: usageStats.today,
        requests_remaining: usageStats.remaining,
        reset_time: usageStats.resetTime.toISOString(),
      }
    }, {
      headers: {
        'X-RateLimit-Limit': '50',
        'X-RateLimit-Remaining': usageStats.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(usageStats.resetTime.getTime() / 1000).toString(),
      }
    });
    
  } catch (error: unknown) {
    console.error('Chat route error:', getErrorMessage(error));

    return NextResponse.json({
      error: 'Sorry, something went wrong. Please try again.'
    }, { status: 500 });
  }
}
