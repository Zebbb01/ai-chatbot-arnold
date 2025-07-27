// =============================================================================
// src/app/api/chat/lib/constants.ts (OPENAI ONLY)
// =============================================================================

export const SCHEDULING_KEYWORDS = ['schedule', 'book', 'appointment', 'meeting', 'remind', 'calendar', 'plan'];
export const CASUAL_GREETINGS = ['hello', 'hi', 'good morning', 'hey', 'thanks', 'how are you'];

// OpenAI Tools format
export const TOOLS_OPENAI = [
  {
    type: 'function',
    function: {
      name: 'create_schedule_event',
      description: 'Creates a new event in the user\'s schedule with optional invitees. ONLY use when user explicitly wants to schedule something.',
      parameters: {
        type: 'object',
        properties: {
          title: { 
            type: 'string', 
            description: 'Event title like "Team Meeting", "Doctor Appointment"' 
          },
          startTime: { 
            type: 'string', 
            description: 'Start time in ISO 8601 format (e.g., "2025-07-25T13:00:00" if no timezone known, or "2025-07-25T13:00:00+08:00" with offset)' 
          },
          endTime: { 
            type: 'string', 
            description: 'Optional end time in ISO 8601 format with timezone' 
          },
          location: { 
            type: 'string', 
            description: 'Optional location or meeting room' 
          },
          invitees: { 
            type: 'array', 
            items: { type: 'string' }, 
            description: 'Array of email addresses to invite to the meeting. Extract emails from user message if mentioned.' 
          },
          description: { 
            type: 'string', 
            description: 'Optional event description or agenda' 
          },
          timeZone: { 
            type: 'string', 
            description: 'The IANA timezone identifier for the user (e.g., "Asia/Manila", "America/New_York"). This MUST be provided by the model if it can infer it from the user\'s context/query, otherwise it defaults to the system\'s inferred timezone.' 
          },
        },
        required: ['title', 'startTime'],
      },
    },
  },
];