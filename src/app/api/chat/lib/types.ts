// =============================================================================
// src/app/api/chat/lib/types.ts
// =============================================================================
export interface ScheduleEventArgs {
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  invitees?: string[];
  description?: string;
  timeZone?: string;
}

export interface ScheduleEventArgsWithMeta extends ScheduleEventArgs {
  userId: string;
  conversationId: string;
  googleEventId?: string;
}