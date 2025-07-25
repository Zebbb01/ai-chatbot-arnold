// =============================================================================
// src/app/api/chat/lib/google-calendar.ts
// =============================================================================
import { db } from '@/lib/db';
import { accounts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { ScheduleEventArgs } from './types';
import { validateInvitees } from './utils';
import { calculateEndTime } from './timezone';

export async function getGoogleAccessToken(userId: string): Promise<string | null> {
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
    
    if (expiresAt && Date.now() >= expiresAt * 1000) {
      console.log('Access token expired, attempting refresh...');
      
      if (!refreshToken) {
        console.error('No refresh token available');
        return null;
      }

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

/**
 * Creates a Google Calendar event with the specified user timezone.
 * @param accessToken User's Google access token.
 * @param event Schedule event arguments.
 * @param userId User ID.
 * @param userTimeZone The IANA timezone identifier for the user (e.g., "America/Los_Angeles").
 * @returns Google Calendar event response with enhanced formatting.
 */
export async function createGoogleCalendarEvent(accessToken: string, event: ScheduleEventArgs, userId: string, userTimeZone: string) {
  const validInvitees = validateInvitees(event.invitees);
  
  let ownerEmail: string | null = null;
  try {
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      ownerEmail = profile.email;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
  
  const endTime = event.endTime || calculateEndTime(event.startTime, 1);
  
  // Enhanced description with better formatting
  let enhancedDescription = event.description || '';
  if (event.description) {
    enhancedDescription += '\n\n';
  }
  enhancedDescription += '📅 Scheduled via Arnold AI Assistant 🤖';
  
  const calendarEvent: any = {
    summary: event.title,
    location: event.location || '',
    description: enhancedDescription,
    // Use the `userTimeZone` provided for the event in Google Calendar
    start: { dateTime: event.startTime, timeZone: userTimeZone }, 
    end: { dateTime: endTime, timeZone: userTimeZone },
    // Add color coding for AI-scheduled events
    colorId: '9' // Blue color to distinguish AI-scheduled events
  };

  const attendees: any[] = [];
  
  if (ownerEmail) {
    attendees.push({
      email: ownerEmail,
      responseStatus: 'accepted',
      organizer: true
    });
  }
  
  validInvitees.forEach(email => {
    if (email.trim().toLowerCase() !== ownerEmail?.toLowerCase()) {
      attendees.push({
        email: email.trim(),
        responseStatus: 'needsAction'
      });
    }
  });
  
  if (attendees.length > 0) {
    calendarEvent.attendees = attendees;
    calendarEvent.sendUpdates = 'all';
    
    // Enhanced conference data with better naming
    calendarEvent.conferenceData = {
      createRequest: {
        requestId: `arnold-meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    };
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
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

  const result = await response.json();
  
  // Enhanced result with better link formatting
  return {
    ...result,
    // Ensure we have properly formatted links
    htmlLink: result.htmlLink || `https://calendar.google.com/calendar/event?eid=${result.id}`,
    // Add Gmail link for invitations if there are attendees
    gmailLink: validInvitees.length > 0 ? `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(event.title)}` : null
  };
}