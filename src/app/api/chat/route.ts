// =============================================================================
// src/app/api/chat/route.ts (MAIN HANDLER)
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, conversations, schedules } from '@/drizzle/schema';
import ollama, { Message } from 'ollama';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Import our organized modules
import { TOOLS } from './lib/constants';
import { isSchedulingRequest, getErrorMessage } from './lib/utils';
// Updated imports
import { createSystemPrompt, DEFAULT_TIMEZONE, parseUserTimeInputToISO } from './lib/timezone'; 
import { handleScheduleEvent } from './lib/scheduling';
import { getOrCreateConversation, getConversationHistory, saveMessage } from './lib/conversation';
import { ScheduleEventArgs } from './lib/types';

// =============================================================================
// MAIN ROUTE HANDLERS
// =============================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { conversationId, userMessage, userTimeZone } = await req.json(); // Expect timezone from client
    const userId = session.user.id;

    // Determine the active timezone for this user/request.
    // Ideally, `userTimeZone` would come from the client or user settings.
    const activeUserTimeZone = userTimeZone || DEFAULT_TIMEZONE; 

    const currentConversationId = await getOrCreateConversation(conversationId, userId, userMessage);
    const history = await getConversationHistory(currentConversationId);
    await saveMessage(currentConversationId, 'user', userMessage);

    const messagesForAI: Message[] = [
      createSystemPrompt(activeUserTimeZone), // Pass the user's timezone to the system prompt
      ...history.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
      { role: 'user', content: userMessage },
    ];

    const shouldSchedule = isSchedulingRequest(userMessage);

    const completion = await ollama.chat({
      model: 'llama3.1:8b-instruct-q4_0',
      messages: messagesForAI,
      ...(shouldSchedule && { tools: TOOLS }),
      options: { temperature: 0.7, num_ctx: 2048 },
    });

    let aiResponse: string;
    const toolCalls = completion.message.tool_calls;

    if (toolCalls && toolCalls.length > 0 && shouldSchedule && toolCalls[0].function.name === 'create_schedule_event') {
      const toolArguments = toolCalls[0].function.arguments as ScheduleEventArgs;

      const eventTimeZone = toolArguments.timeZone || activeUserTimeZone;

      let finalStartTime = toolArguments.startTime;
      if (!finalStartTime.includes('T')) { // Simple check if it's missing date/ISO format
        const parsedTime = parseUserTimeInputToISO(toolArguments.startTime, eventTimeZone);
        if (parsedTime) {
          finalStartTime = parsedTime;
        } else {
          aiResponse = "I couldn't understand the time you provided for scheduling. Please be more specific (e.g., 'tomorrow at 2 PM').";
          await saveMessage(currentConversationId, 'assistant', aiResponse);
          return NextResponse.json({ reply: aiResponse, conversationId: currentConversationId, processingTime: Date.now() - startTime });
        }
      }

      // If endTime is provided by the model and is not an ISO string, parse it too.
      let finalEndTime = toolArguments.endTime;
      if (finalEndTime && !finalEndTime.includes('T')) {
          const parsedEndTime = parseUserTimeInputToISO(finalEndTime, eventTimeZone);
          if (parsedEndTime) {
              finalEndTime = parsedEndTime;
          }
          // If parsing fails for endTime, it's okay to let calculateEndTime handle it.
      }


      aiResponse = await handleScheduleEvent({
        userId,
        conversationId: currentConversationId,
        ...toolArguments,
        startTime: finalStartTime, // Use the parsed/validated start time
        endTime: finalEndTime,     // Use the parsed/validated end time
        timeZone: eventTimeZone,   // Pass the determined timezone to the handler
      });
    } else {
      aiResponse = completion.message.content || "I didn't understand that. Could you rephrase?";
    }

    await saveMessage(currentConversationId, 'assistant', aiResponse);

    return NextResponse.json({
      reply: aiResponse,
      conversationId: currentConversationId,
      processingTime: Date.now() - startTime,
    });
  } catch (error: unknown) {
    console.error('Chat route error:', getErrorMessage(error));
    return NextResponse.json({ error: 'Sorry, something went wrong. Please try again.' }, { status: 500 });
  }
}