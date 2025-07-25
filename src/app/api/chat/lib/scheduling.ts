// =============================================================================
// src/app/api/chat/lib/scheduling.ts
// =============================================================================
import { db } from '@/lib/db';
import { schedules } from '@/drizzle/schema';
import { ScheduleEventArgs, ScheduleEventArgsWithMeta } from './types';
import { validateInvitees, getErrorMessage } from './utils';
// Import updated timezone functions
import { calculateEndTime, parseUserTimeInputToISO, DEFAULT_TIMEZONE } from './timezone';
import { getGoogleAccessToken, createGoogleCalendarEvent } from './google-calendar';

export async function createLocalSchedule(args: ScheduleEventArgsWithMeta) {
    const validInvitees = validateInvitees(args.invitees);

    // The startTime and endTime from tool arguments are expected to be ISO 8601 with offset
    // and will be parsed correctly by `new Date()`.
    const startTimeDate = new Date(args.startTime);
    const endTimeDate = args.endTime ? new Date(args.endTime) : new Date(startTimeDate.getTime() + 3600000); // 1 hour default

    await db.insert(schedules).values({
        userId: args.userId,
        conversationId: args.conversationId,
        title: args.title,
        description: args.description || null,
        startTime: startTimeDate, // Drizzle handles Date objects with `withTimezone: true` correctly
        endTime: endTimeDate,
        location: args.location || null,
        invitees: validInvitees.length > 0 ? validInvitees : null,
        googleEventId: args.googleEventId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
}

export async function handleScheduleEvent(
    args: ScheduleEventArgs & { userId: string; conversationId: string; userTimeZone?: string; }
): Promise<string> {
    // Use the timezone provided by the tool call, or fall back to default/inferred if available.
    const actualUserTimeZone = args.timeZone || DEFAULT_TIMEZONE;

    if (!args.title || !args.startTime) {
        return "I need the event title and start time to schedule this.";
    }

    try {
        const validInvitees = validateInvitees(args.invitees);
        const processedArgs = { ...args, invitees: validInvitees };

        // Create Google Calendar event
        const accessToken = await getGoogleAccessToken(args.userId);
        let googleEventId: string | undefined;
        let googleInfo = '';

        if (accessToken) {
            try {
                // Pass the actualUserTimeZone to Google Calendar creation
                const calendarEvent = await createGoogleCalendarEvent(accessToken, processedArgs, args.userId, actualUserTimeZone);
                googleEventId = calendarEvent.id;

                // Format Google Calendar link properly without icon
                if (calendarEvent.htmlLink) {
                    googleInfo += `\n\n[View in Google Calendar](${calendarEvent.htmlLink})`;
                }

                if (validInvitees.length > 0) {
                    // Use standard Markdown list for invitees
                    googleInfo += `\n\n**Invitations sent to:**\n${validInvitees.map(email => `\n• ${email}`).join('\n')}`;

                    const meetLink = calendarEvent.conferenceData?.entryPoints?.find(
                        (entry: any) => entry.entryPointType === 'video'
                    );
                    if (meetLink) {
                        // Google Meet link without icon
                        googleInfo += `\n\n**Google Meet:** [Join Meeting](${meetLink.uri})\n\n`;
                        googleInfo += `\n\n**Note:** This Meet link can be accessed anytime, not just during the scheduled time.`;
                    }
                }
            } catch (error) {
                console.error('Google Calendar sync error:', getErrorMessage(error));
                googleInfo = '\n\n*Note: Could not sync with Google Calendar.*';
            }
        } else {
            googleInfo = '\n\n*Note: Could not sync with Google Calendar - authentication required.*';
        }

        // Save to local database
        await createLocalSchedule({ ...processedArgs, googleEventId });

        // Format response for the user in their timezone
        const startDate = new Date(args.startTime); // Date object correctly interprets the ISO string
        const endDate = new Date(args.endTime || calculateEndTime(args.startTime));

        // Now use the `actualUserTimeZone` for formatting the response back to the user
        const formattedDate = startDate.toLocaleDateString('en-US', {
            timeZone: actualUserTimeZone,
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const startTime = startDate.toLocaleTimeString('en-US', {
            timeZone: actualUserTimeZone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const endTime = endDate.toLocaleTimeString('en-US', {
            timeZone: actualUserTimeZone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Build response with introductory phrase and H1 title
        let response = `Sure, here's your Schedule:\n\n`; // Added introductory phrase
        response += `# ${args.title}\n\n`; // Using H1 for the title

        response += `**Date:** ${formattedDate}\n`;
        response += `**Time:** ${startTime} - ${endTime} (${actualUserTimeZone.split('/').pop()?.replace('_', ' ') || 'Local Time'})`;

        if (args.location) {
            response += `\n\n**Location:** ${args.location}`;
        }

        if (args.description) {
            response += `\n\n**Description:**\n${args.description}`;
        }

        // Add Google Calendar info
        if (googleInfo) {
            response += googleInfo;
        }

        return response;
    } catch (error: unknown) {
        console.error('Schedule creation error:', getErrorMessage(error));
        return `Sorry, I couldn't create that event. Error: ${getErrorMessage(error)}. Please try again.`;
    }
}