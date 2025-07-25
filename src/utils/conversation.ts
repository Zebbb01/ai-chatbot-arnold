// src/utils/conversation.ts
import { Conversation } from '@/types/conversation';

/**
 * Truncate conversation title for display
 */
export const truncateTitle = (title: string, maxLength: number = 35): string => {
  if (title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength).trim() + "...";
};

/**
 * Sort conversations: pinned first, then by creation date (newest first)
 */
export const sortConversations = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => {
    // Pinned conversations first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Then by creation date (newest first)
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
};

/**
 * Check if a conversation is currently active based on pathname
 */
export const isConversationActive = (conversationId: string, pathname: string): boolean => {
  return pathname.includes(conversationId);
};