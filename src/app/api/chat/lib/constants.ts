// =============================================================================
// src/app/api/chat/lib/constants.ts
// =============================================================================
export const SCHEDULING_KEYWORDS = ['schedule', 'book', 'appointment', 'meeting', 'remind', 'calendar', 'plan'];
export const CASUAL_GREETINGS = ['hello', 'hi', 'good morning', 'hey', 'thanks', 'how are you'];

export const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_schedule_event',
      description: 'Creates a new event in the user\'s schedule with optional invitees. ONLY use when user explicitly wants to schedule something.',
      parameters: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const, description: 'Event title like "Team Meeting", "Doctor Appointment"' },
          startTime: { type: 'string' as const, description: 'Start time in ISO 8601 format (e.g., "2025-07-25T13:00:00" if no timezone known, or "2025-07-25T13:00:00+08:00" with offset)' },
          endTime: { type: 'string' as const, description: 'Optional end time in ISO 8601 format with timezone' },
          location: { type: 'string' as const, description: 'Optional location or meeting room' },
          invitees: { type: 'array' as const, items: { type: 'string' as const }, description: 'Array of email addresses to invite to the meeting. Extract emails from user message if mentioned.' },
          description: { type: 'string' as const, description: 'Optional event description or agenda' },
          // Add a property for the explicit timezone
          timeZone: { type: 'string' as const, description: 'The IANA timezone identifier for the user (e.g., "Asia/Manila", "America/New_York"). This MUST be provided by the model if it can infer it from the user\'s context/query, otherwise it defaults to the system\'s inferred timezone.' },
        },
        required: ['title', 'startTime'],
      },
    },
  },
];