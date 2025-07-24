// src/app/api/chat/route.ts - FIXED GOOGLE CALENDAR INTEGRATION

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, conversations, schedules, accounts } from '@/drizzle/schema';
import ollama, { Message } from 'ollama';
import { v4 as uuidv4 } from 'uuid';
import { eq, asc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// ============================================================================
// TYPES & CONFIGURATIONS
// ============================================================================
interface ScheduleEventArgs {
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
}

const SCHEDULING_KEYWORDS = ['schedule', 'book', 'appointment', 'meeting', 'remind', 'calendar', 'plan'];
const CASUAL_GREETINGS = ['hello', 'hi', 'good morning', 'hey', 'thanks', 'how are you'];

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_schedule_event',
      description: 'Creates a new event in the user\'s schedule. ONLY use when user explicitly wants to schedule something.',
      parameters: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const, description: 'Event title like "Team Meeting", "Doctor Appointment"' },
          startTime: { type: 'string' as const, description: 'Start time in ISO 8601 format' },
          endTime: { type: 'string' as const, description: 'Optional end time in ISO 8601 format' },
          location: { type: 'string' as const, description: 'Optional location' },
        },
        required: ['title', 'startTime'],
      },
    },
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function isSchedulingRequest(message: string): boolean {
  const lower = message.toLowerCase();
  if (CASUAL_GREETINGS.some(greeting => lower.includes(greeting) && lower.length < 50)) {
    return false;
  }
  return SCHEDULING_KEYWORDS.some(keyword => lower.includes(keyword));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error occurred';
}

function createSystemPrompt(): Message {
  return {
    role: 'system',
    content: `You are Arnold, a friendly AI scheduling assistant.

CRITICAL RULES:
- ONLY create events when users explicitly request scheduling
- DO NOT create events for greetings or casual questions
- Ask for clarification if unsure whether to schedule

Current time: ${new Date().toISOString()}`,
  };
}

// ============================================================================
// GOOGLE CALENDAR INTEGRATION - DIRECT IMPLEMENTATION
// ============================================================================

async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    const account = await db
      .select({
        accessToken: accounts.access_token,
        refreshToken: accounts.refresh_token,
        expiresAt: accounts.expires_at,
      })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);

    if (!account.length || !account[0].accessToken) {
      console.error('No Google access token found for user:', userId);
      return null;
    }

    const { accessToken, refreshToken, expiresAt } = account[0];
    
    // Check if token is expired
    if (expiresAt && Date.now() >= expiresAt * 1000) {
      console.log('Access token expired, attempting refresh...');
      
      if (!refreshToken) {
        console.error('No refresh token available');
        return null;
      }

      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error('Failed to refresh token:', errorText);
        return null;
      }

      const refreshData = await refreshResponse.json();
      
      // Update the database with new token
      await db
        .update(accounts)
        .set({
          access_token: refreshData.access_token,
          expires_at: Math.floor(Date.now() / 1000) + refreshData.expires_in,
        })
        .where(eq(accounts.userId, userId));

      return refreshData.access_token;
    }

    return accessToken;
  } catch (error) {
    console.error('Error getting Google access token:', error);
    return null;
  }
}

async function createGoogleCalendarEvent(accessToken: string, event: ScheduleEventArgs) {
  const calendarEvent = {
    summary: event.title,
    location: event.location || '',
    start: {
      dateTime: event.startTime,
      timeZone: 'Asia/Manila',
    },
    end: {
      dateTime: event.endTime || new Date(new Date(event.startTime).getTime() + 3600000).toISOString(),
      timeZone: 'Asia/Manila',
    },
  };

  console.log('Creating calendar event:', calendarEvent);

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Calendar API error:', response.status, errorText);
    throw new Error(`Google Calendar API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============================================================================
// SCHEDULING FUNCTIONS
// ============================================================================

async function createLocalSchedule(args: ScheduleEventArgs & { userId: string; conversationId: string; }) {
  await db.insert(schedules).values({
    userId: args.userId,
    conversationId: args.conversationId,
    title: args.title,
    startTime: new Date(args.startTime),
    endTime: args.endTime ? new Date(args.endTime) : new Date(new Date(args.startTime).getTime() + 3600000),
    location: args.location,
  });
}

async function syncWithGoogleCalendar(args: ScheduleEventArgs & { userId: string; }): Promise<string> {
  try {
    // FIXED: Direct Google Calendar integration without internal API call
    const accessToken = await getGoogleAccessToken(args.userId);
    
    if (!accessToken) {
      console.error('Unable to get Google Calendar access token');
      return ' (Note: Could not sync with Google Calendar - please check your authentication)';
    }

    const calendarEvent = await createGoogleCalendarEvent(accessToken, args);
    
    return calendarEvent.htmlLink 
      ? ` [View in Google Calendar](${calendarEvent.htmlLink})` 
      : ' (Event created in Google Calendar)';
    
  } catch (error: unknown) {
    console.error('Google Calendar sync error:', getErrorMessage(error));
    return ' (Note: Could not sync with Google Calendar)';
  }
}

async function handleScheduleEvent(args: ScheduleEventArgs & { userId: string; conversationId: string; }): Promise<string> {
  if (!args.title || !args.startTime) {
    return "I need the event title and start time to schedule this.";
  }

  try {
    // Create local schedule entry
    await createLocalSchedule(args);
    
    // Format response
    const startDate = new Date(args.startTime);
    let response = `✅ Scheduled "${args.title}" for ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}`;
    if (args.location) response += ` at ${args.location}`;
    
    // Sync with Google Calendar
    const googleLink = await syncWithGoogleCalendar(args);
    response += googleLink;
    
    return response;
  } catch (error: unknown) {
    console.error('Schedule creation error:', getErrorMessage(error));
    return "Sorry, I couldn't create that event. Please try again.";
  }
}

// ============================================================================
// CONVERSATION FUNCTIONS
// ============================================================================

async function getOrCreateConversation(conversationId: string | null, userId: string, userMessage: string): Promise<string> {
  if (conversationId) return conversationId;

  const newId = uuidv4();
  await db.insert(conversations).values({
    id: newId,
    userId,
    title: userMessage.substring(0, 40) || 'Chat Session',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return newId;
}

async function getConversationHistory(conversationId: string) {
  return db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(10);
}

async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
  await db.insert(messages).values({
    conversationId,
    role,
    content,
    createdAt: new Date(),
  });
}

// ============================================================================
// MAIN ROUTE HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { conversationId, userMessage } = await req.json();
    const userId = session.user.id;

    const currentConversationId = await getOrCreateConversation(conversationId, userId, userMessage);
    const history = await getConversationHistory(currentConversationId);
    await saveMessage(currentConversationId, 'user', userMessage);

    const messagesForAI: Message[] = [
      createSystemPrompt(),
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
      aiResponse = await handleScheduleEvent({
        userId,
        conversationId: currentConversationId,
        ...(toolCalls[0].function.arguments as ScheduleEventArgs),
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

// ============================================================================
// UPDATE/DELETE HANDLERS
// ============================================================================

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { conversationId, action, data } = await req.json();

    const updateData = action === 'rename'
      ? { title: data.title, updatedAt: new Date() }
      : { isPinned: data.isPinned, updatedAt: new Date() };

    await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, conversationId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    await db.delete(schedules).where(eq(schedules.conversationId, conversationId));
    await db.delete(conversations).where(eq(conversations.id, conversationId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}