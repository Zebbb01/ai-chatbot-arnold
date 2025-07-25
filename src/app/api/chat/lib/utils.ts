// =============================================================================
// src/app/api/chat/lib/utils.ts
// =============================================================================
import { SCHEDULING_KEYWORDS, CASUAL_GREETINGS } from './constants';

export function isSchedulingRequest(message: string): boolean {
  const lower = message.toLowerCase();
  if (CASUAL_GREETINGS.some(greeting => lower.includes(greeting) && lower.length < 50)) {
    return false;
  }
  return SCHEDULING_KEYWORDS.some(keyword => lower.includes(keyword));
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error occurred';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateInvitees(invitees?: string[] | string): string[] {
  if (!invitees) return [];
  
  let emailArray: string[] = [];
  
  if (typeof invitees === 'string') {
    try {
      const parsed = JSON.parse(invitees);
      emailArray = Array.isArray(parsed) ? parsed : [invitees];
    } catch {
      emailArray = [invitees];
    }
  } else if (Array.isArray(invitees)) {
    emailArray = invitees;
  } else {
    emailArray = [String(invitees)];
  }
  
  return emailArray.filter(email => {
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      console.warn(`Invalid email address: ${trimmedEmail}`);
      return false;
    }
    return true;
  });
}