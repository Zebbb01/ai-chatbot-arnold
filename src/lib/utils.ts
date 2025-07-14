// src/lib/utils.ts

/**
 * Formats a given Date object into a readable string (e.g., "Jul 13, 2025, 4:22 PM").
 * @param date The Date object to format.
 * @returns A formatted date string.
 */
export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

/**
 * Sanitizes a string to prevent basic XSS attacks.
 * (Note: For robust security, consider a dedicated library like DOMPurify).
 * @param text The input string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeText(text: string): string {
  // Basic HTML escaping
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (m) => map[m]);
}

// You can add more utility functions here as your project grows.
// For example, a function to debounce input, throttle events, etc.