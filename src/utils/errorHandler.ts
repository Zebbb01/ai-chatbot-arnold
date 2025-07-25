// src/utils/errorHandler.ts
/**
 * Error handling utility for conversation operations
 */
export class ConversationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ConversationError';
  }
}

/**
 * Handle API errors and convert them to user-friendly messages
 */
export const handleConversationError = (error: unknown): string => {
  if (error instanceof ConversationError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Common error patterns
    if (error.message.includes('Authentication required')) {
      return 'Please sign in to perform this action.';
    }
    if (error.message.includes('not found')) {
      return 'Conversation not found or has been deleted.';
    }
    if (error.message.includes('access denied')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Log errors with context for debugging
 */
export const logConversationError = (
  operation: string,
  error: unknown,
  context?: Record<string, any>
): void => {
  console.error(`[ConversationError] ${operation}:`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  });
};