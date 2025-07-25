// src/app/api/chat/lib/scheduling.ts - Enhanced response formatting
import { db } from '@/lib/db';
import { schedules } from '@/drizzle/schema';
import { ScheduleEventArgs, ScheduleEventArgsWithMeta } from './types';
import { validateInvitees, getErrorMessage } from './utils';
import { calculateEndTime, parseUserTimeInputToISO, DEFAULT_TIMEZONE } from './timezone';
import { getGoogleAccessToken, createGoogleCalendarEvent } from './google-calendar';

// Enhanced response phrases for variety
const RESPONSE_OPENERS = [
    "Perfect! I've scheduled your event:",
    "All set! Here's your new appointment:",
    "Great! Your meeting is now scheduled:",
    "Done! I've created your event:",
    "Excellent! Your schedule has been updated:",
    "Success! Here's your new calendar entry:",
];

const getRandomOpener = () => RESPONSE_OPENERS[Math.floor(Math.random() * RESPONSE_OPENERS.length)];

export async function createLocalSchedule(args: ScheduleEventArgsWithMeta) {
    const validInvitees = validateInvitees(args.invitees);
    const startTimeDate = new Date(args.startTime);
    const endTimeDate = args.endTime ? new Date(args.endTime) : new Date(startTimeDate.getTime() + 3600000);

    await db.insert(schedules).values({
        userId: args.userId,
        conversationId: args.conversationId,
        title: args.title,
        description: args.description || null,
        startTime: startTimeDate,
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
        let googleCalendarLink = '';
        let meetingLink = '';

        if (accessToken) {
            try {
                const calendarEvent = await createGoogleCalendarEvent(accessToken, processedArgs, args.userId, actualUserTimeZone);
                googleEventId = calendarEvent.id;

                if (calendarEvent.htmlLink) {
                    googleCalendarLink = calendarEvent.htmlLink;
                }

                const meetLink = calendarEvent.conferenceData?.entryPoints?.find(
                    (entry: any) => entry.entryPointType === 'video'
                );
                if (meetLink) {
                    meetingLink = meetLink.uri;
                }
            } catch (error) {
                console.error('Google Calendar sync error:', getErrorMessage(error));
            }
        }

        // Save to local database
        await createLocalSchedule({ ...processedArgs, googleEventId });

        // Format response with enhanced UI
        const startDate = new Date(args.startTime);
        const endDate = new Date(args.endTime || calculateEndTime(args.startTime));

        const formattedDate = startDate.toLocaleDateString('en-US', {
            timeZone: actualUserTimeZone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
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

        const timezoneName = actualUserTimeZone.split('/').pop()?.replace('_', ' ') || 'Local Time';

        // Build enhanced response
        let response = `${getRandomOpener()}\n\n`;
        
        // Event title with emoji
        response += `# 📅 ${args.title}\n\n`;

        // Main event details in a card-like format
        response += `**📆 Date:** ${formattedDate}\n`;
        response += `**⏰ Time:** ${startTime} - ${endTime} (${timezoneName})\n`;

        if (args.location) {
            response += `**📍 Location:** ${args.location}\n`;
        }

        if (args.description) {
            response += `\n**📝 Details:**\n${args.description}\n`;
        }

        // Technical details table for comprehensive view
        if (validInvitees.length > 0 || googleCalendarLink) {
            response += `\n---\n\n## Event Summary Table\n\n`;
            response += `| **Field** | **Details** |\n`;
            response += `|-----------|-------------|\n`;
            response += `| **Event Name** | ${args.title} |\n`;
            response += `| **Date** | ${formattedDate} |\n`;
            response += `| **Time** | ${startTime} - ${endTime} (${timezoneName}) |\n`;
            response += `| **Start Time (ISO)** | ${args.startTime} |\n`;
            response += `| **End Time (ISO)** | ${args.endTime || calculateEndTime(args.startTime)} |\n`;
            response += `| **Timezone** | ${actualUserTimeZone} |\n`;
            
            if (args.location) {
                response += `| **Location** | ${args.location} |\n`;
            }
            
            if (args.description) {
                response += `| **Description** | ${args.description} |\n`;
            }
        }

        // Google Calendar integration info
        if (googleCalendarLink) {
            response += `\n## 🔗 Quick Actions\n\n`;
            response += `[📅 View in Google Calendar](${googleCalendarLink})\n\n`;
        }

        // Invitees section with enhanced formatting
        if (validInvitees.length > 0) {
            response += `## 👥 Meeting Invitations\n\n`;
            response += `**✅ Invitations sent to:**\n\n`;
            
            // Invitees table
            response += `| **Attendee** | **Status** |\n`;
            response += `|--------------|------------|\n`;
            validInvitees.forEach(email => {
                response += `| ${email} | Pending Response |\n`;
            });

            // Meeting link
            if (meetingLink) {
                response += `\n**🎥 Video Conference:**\n`;
                response += `[🚀 Join Google Meet](${meetingLink})\n\n`;
                response += `> **💡 Pro Tip:** This Meet link is available anytime - you don't have to wait for the scheduled time!\n`;
            }
        }

        // Status footer
        response += `\n---\n\n`;
        if (accessToken) {
            response += `✅ **Successfully synced with Google Calendar**\n`;
            if (validInvitees.length > 0) {
                response += `✅ **Email invitations sent to all participants**\n`;
            }
        } else {
            response += `⚠️ **Note:** Could not sync with Google Calendar - authentication required.\n`;
        }

        response += `\n*Event created by Arnold AI Assistant* 🤖`;

        return response;
    } catch (error: unknown) {
        console.error('Schedule creation error:', getErrorMessage(error));
        return `❌ **Oops!** I couldn't create that event.\n\n**Error:** ${getErrorMessage(error)}\n\nPlease try again or let me know if you need help! 🤔`;
    }
}