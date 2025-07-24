// src/app/api/google-calendar/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { accounts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

interface CalendarEvent {
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  userId: string;
}

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

async function createGoogleCalendarEvent(accessToken: string, event: CalendarEvent) {
  const calendarEvent = {
    summary: event.title,
    location: event.location || '',
    start: {
      dateTime: event.startTime,
      timeZone: 'Asia/Manila', // Adjust to your timezone
    },
    end: {
      dateTime: event.endTime,
      timeZone: 'Asia/Manila', // Adjust to your timezone
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { title, startTime, endTime, location } = await req.json();

    if (!title || !startTime) {
      return NextResponse.json(
        { error: 'Title and start time are required' },
        { status: 400 }
      );
    }

    // Get Google access token
    const accessToken = await getGoogleAccessToken(session.user.id);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unable to get Google Calendar access. Please sign in again.' },
        { status: 401 }
      );
    }

    // Create event in Google Calendar
    const calendarEvent = await createGoogleCalendarEvent(accessToken, {
      title,
      startTime,
      endTime: endTime || new Date(new Date(startTime).getTime() + 3600000).toISOString(),
      location,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      calendarEventLink: calendarEvent.htmlLink,
      eventId: calendarEvent.id,
    });

  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Google Calendar' },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to fetch calendar events
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessToken = await getGoogleAccessToken(session.user.id);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unable to get Google Calendar access' },
        { status: 401 }
      );
    }

    // Fetch upcoming events
    const { searchParams } = new URL(req.url);
    const maxResults = searchParams.get('maxResults') || '10';
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch calendar events:', errorText);
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      events: data.items || [],
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}