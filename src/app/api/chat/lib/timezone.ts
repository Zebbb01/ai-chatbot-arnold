// =============================================================================
// src/app/api/chat/lib/timezone.ts
// =============================================================================

// Define a generic message type that matches OpenAI's chat completion message structure
// This replaces the Ollama Message import
export type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string; // For tool calls
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
};


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

  // Check for common date keywords (today, tomorrow, next week) before processing time
  if (userInput.toLowerCase().includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (userInput.toLowerCase().includes('next week')) {
    targetDate.setDate(targetDate.getDate() + 7);
  }
  // No explicit 'today' handling needed as targetDate already starts with today

  let hours: number | undefined;
  let minutes: number = 0;

  if (timeMatch) {
    hours = parseInt(timeMatch[1]);
    minutes = parseInt(timeMatch[2] || '0');
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
  } else {
    // If no specific time is mentioned, we can't form a complete timestamp.
    // For scheduling, a time is usually required.
    return null;
  }

  // Set the hours and minutes for the targetDate using its *local* methods.
  // We need to be careful with `setHours` if it manipulates UTC internally
  // and we want to preserve the local time.
  // A more robust approach would be to calculate the UTC equivalent of the local time.
  // For simplicity, let's assume `setHours` and `setMinutes` work as expected relative to `userLocalNow`
  // for setting the time portion of the date.
  targetDate.setHours(hours);
  targetDate.setMinutes(minutes);
  targetDate.setSeconds(0);
  targetDate.setMilliseconds(0);


  // To accurately get the ISO string with the *correct offset for the targetDate and timezone*,
  // we can use a more reliable method than parsing `timeZoneName` which can be inconsistent.
  // We'll calculate the offset relative to UTC for that specific date in that timezone.

  // Get the UTC time of the targetDate
  const utcDate = new Date(targetDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const targetDateInTimeZone = new Date(targetDate.toLocaleString('en-US', { timeZone: userTimeZone }));

  // Calculate the difference in minutes between UTC and the target timezone at that specific time
  const offsetMinutes = (targetDateInTimeZone.getTime() - utcDate.getTime()) / (1000 * 60);

  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
  const offsetRemainingMinutes = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
  const offsetStr = `${offsetSign}${offsetHours}:${offsetRemainingMinutes}`;

  // Format the date parts, padding with zeros
  const year = targetDateInTimeZone.getFullYear();
  const month = String(targetDateInTimeZone.getMonth() + 1).padStart(2, '0');
  const day = String(targetDateInTimeZone.getDate()).padStart(2, '0');
  const hourStr = String(targetDateInTimeZone.getHours()).padStart(2, '0');
  const minuteStr = String(targetDateInTimeZone.getMinutes()).padStart(2, '0');
  const secondStr = String(targetDateInTimeZone.getSeconds()).padStart(2, '0');


  return `${year}-${month}-${day}T${hourStr}:${minuteStr}:${secondStr}${offsetStr}`;
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

  // To preserve the original offset, we need to format the `endDate`'s components
  // according to the *original offset*, not necessarily UTC or local system time.
  // A robust way to do this is to get the UTC components of `endDate` and then
  // construct the string with the `originalOffset`.

  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');
  const hour = String(endDate.getHours()).padStart(2, '0');
  const minute = String(endDate.getMinutes()).padStart(2, '0');
  const second = String(endDate.getSeconds()).padStart(2, '0');

  // Note: Using `getFullYear`, `getMonth`, etc., directly on `endDate` will give
  // values in the system's local timezone. If the original intent was to perform
  // arithmetic and then present the result *still in the user's timezone*,
  // then directly appending the `originalOffset` is the correct approach.

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${originalOffset}`;
}


/**
 * Creates the system prompt for the AI, now dynamically including the user's timezone.
 * @param userTimeZone The IANA timezone identifier of the current user.
 * @returns An object conforming to the ChatCompletionMessage type for the system prompt.
 */
export function createSystemPrompt(userTimeZone: string): ChatCompletionMessage {
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