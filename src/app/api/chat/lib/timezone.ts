// =============================================================================
// src/app/api/chat/lib/timezone.ts
// =============================================================================
import { Message } from 'ollama';

export const DEFAULT_TIMEZONE = 'Asia/Manila'; // Fallback if user's timezone isn't detected

/**
 * Parses a user's natural language time input relative to a specific timezone
 * and returns an ISO 8601 string with the correct offset.
 * @param userInput The user's message, e.g., "tomorrow at 2 PM", "today at 10:30 AM".
 * @param userTimeZone The IANA timezone identifier of the user (e.g., "America/New_York", "Asia/Manila").
 * @param referenceDate Optional: A date to use as 'now' for calculation (useful for testing).
 * @returns ISO 8601 string with offset (e.g., "2025-07-26T14:00:00+08:00") or null if parsing fails.
 */
export function parseUserTimeInputToISO(userInput: string, userTimeZone: string, referenceDate?: Date): string | null {
    const now = referenceDate || new Date();

    const userLocalNow = new Date(now.toLocaleString('en-US', { timeZone: userTimeZone }));
    let targetDate = new Date(userLocalNow); // Start with today's date in user's timezone

    const timeMatch = userInput.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);

    if (!timeMatch) {
        // If no specific time is mentioned, we can't form a complete timestamp.
        // For scheduling, a time is usually required.
        return null;
    }

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2] || '0');
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    if (userInput.toLowerCase().includes('tomorrow')) {
        targetDate.setDate(targetDate.getDate() + 1);
    } else if (userInput.toLowerCase().includes('next week')) {
        targetDate.setDate(targetDate.getDate() + 7);
    }
    // No explicit 'today' handling needed as targetDate already starts with today

    // Set the hours and minutes for the targetDate using its *local* methods.
    targetDate.setHours(hours);
    targetDate.setMinutes(minutes);
    targetDate.setSeconds(0);
    targetDate.setMilliseconds(0);

    const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: userTimeZone,
        timeZoneName: 'longOffset' // To get the offset like "+0800"
    });

    // Get parts to find the offset
    const parts = formatter.formatToParts(targetDate);
    let year = '';
    let month = '';
    let day = '';
    let hourStr = '';
    let minuteStr = '';
    let secondStr = '';
    let offsetStr = ''; // e.g., '+0800' or '-0500'

    for (const part of parts) {
        if (part.type === 'year') year = part.value;
        else if (part.type === 'month') month = part.value;
        else if (part.type === 'day') day = part.value;
        else if (part.type === 'hour') hourStr = part.value;
        else if (part.type === 'minute') minuteStr = part.value;
        else if (part.type === 'second') secondStr = part.value;
        else if (part.type === 'timeZoneName') {
            const match = part.value.match(/GMT([+-]\d{1,2}):?(\d{2})?/);
            if (match) {
                // Format to standard ISO offset like "+08:00"
                offsetStr = `${match[1].padStart(3, '+0').padEnd(3, '0')}:${(match[2] || '00').padStart(2, '0')}`;
            } else {
                console.warn(`Could not parse timezone offset from ${part.value}. Defaulting to UTC offset.`);
                offsetStr = '+00:00'; // Fallback to UTC if timezone offset can't be determined reliably
            }
        }
    }

    if (!offsetStr) {
        // As a fallback, try to determine the current offset for that timezone.
        // This is less accurate for historical/future dates but better than nothing.
        const offsetMinutes = targetDate.getTimezoneOffset();
        const utcTime = targetDate.toISOString().slice(0, -1); // Remove 'Z'
        if (!offsetStr) {
            const localOffsetMinutes = -targetDate.getTimezoneOffset(); // getTimezoneOffset is minutes *behind* UTC, so invert
            const offsetHours = Math.floor(localOffsetMinutes / 60);
            const offsetRemainingMinutes = Math.abs(localOffsetMinutes % 60);
            offsetStr = `${offsetHours >= 0 ? '+' : '-'}${String(Math.abs(offsetHours)).padStart(2, '0')}:${String(offsetRemainingMinutes).padStart(2, '0')}`;
        }
    }

    return `${year}-${month}-${day}T${hourStr}:${minuteStr}:${secondStr || '00'}${offsetStr}`;
}

/**
 * Calculates the end time given a start time in ISO 8601 format and a duration,
 * preserving the original timezone.
 * @param startTimeISO ISO 8601 string with timezone (e.g., "2025-07-26T14:00:00+08:00").
 * @param durationHours Duration in hours.
 * @returns ISO 8601 string with the same offset as startTimeISO.
 */
export function calculateEndTime(startTimeISO: string, durationHours: number = 1): string {
    const startDate = new Date(startTimeISO);
    const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000));

    // Extract the original offset from startTimeISO
    const timezoneMatch = startTimeISO.match(/([+-]\d{2}:\d{2}|Z)$/);
    const originalOffset = timezoneMatch ? timezoneMatch[1] : '';

    if (originalOffset === 'Z') {
        return endDate.toISOString();
    }

    const inferredTimeZone = `GMT${originalOffset}`; // This is a heuristic, better to pass the original timezone name

    // Use Intl.DateTimeFormat to get components based on the implied timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC',
    });

    // Get components of the endDate in UTC
    const year = endDate.getUTCFullYear();
    const month = String(endDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(endDate.getUTCDate()).padStart(2, '0');
    const hour = String(endDate.getUTCHours()).padStart(2, '0');
    const minute = String(endDate.getUTCMinutes()).padStart(2, '0');
    const second = String(endDate.getUTCSeconds()).padStart(2, '0');


    return `${year}-${month}-${day}T${hour}:${minute}:${second}${originalOffset}`;
}


/**
 * Creates the system prompt for the AI, now dynamically including the user's timezone.
 * @param userTimeZone The IANA timezone identifier of the current user.
 * @returns An Ollama Message object for the system prompt.
 */
export function createSystemPrompt(userTimeZone: string): Message {
    const now = new Date();
    // Get the current time formatted for the user's timezone for the prompt.
    const currentUserTime = now.toLocaleString("en-US", {
        timeZone: userTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'shortOffset' // e.g., "GMT+8"
    });

    return {
        role: 'system',
        content: `You are Arnold, a friendly AI scheduling assistant.

CURRENT TIME: ${currentUserTime} (Your current local time in ${userTimeZone})

CRITICAL TIMEZONE RULES:
- All times given by the user in natural language (e.g., "tomorrow at 2 PM") should be interpreted relative to THEIR current timezone: "${userTimeZone}".
- When using the \`create_schedule_event\` tool, ALWAYS provide the \`timeZone\` argument with the value "${userTimeZone}".
- The \`startTime\` and \`endTime\` in the tool call MUST be in ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ss+HH:MM") and reflect the time in the user's timezone, with the correct offset.
- Example: If the user in "America/New_York" (UTC-5) says "schedule a meeting tomorrow at 9 AM", the startTime should be "YYYY-MM-DDT09:00:00-05:00" and timeZone should be "America/New_York".

EXAMPLES:
- User in "Asia/Manila" (UTC+8) says "meeting tomorrow at 1 PM until 3 PM" → startTime: "YYYY-MM-DDT13:00:00+08:00", endTime: "YYYY-MM-DDT15:00:00+08:00", timeZone: "Asia/Manila"
- User in "America/Los_Angeles" (UTC-7) says "appointment today at 9 AM" → startTime: "YYYY-MM-DDT09:00:00-07:00", timeZone: "America/Los_Angeles"

INVITEE HANDLING:
- Extract email addresses from user messages.
- If user mentions names without emails, ask for email addresses.
- Create calendar invites for all valid emails.

CRITICAL RULES:
- ONLY create events when users explicitly request scheduling.
- Always use the user's inferred or specified timezone.
- Ask for clarification if timing is unclear.`,
    };
}