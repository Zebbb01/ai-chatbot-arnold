// src/services/conversationService.ts
import { Conversation } from '@/types/conversation';

export class ConversationService {
  /**
   * Fetch conversations for a user
   */
  static async fetchConversations(userId: string): Promise<Conversation[]> {
    try {
      const res = await fetch(`/api/conversations?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }

  /**
   * Toggle pin status of a conversation
   */
  static async togglePin(conversationId: string, isPinned: boolean): Promise<void> {
    const res = await fetch(`/api/conversations/${conversationId}/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to toggle pin');
    }
  }

  /**
   * Rename a conversation
   */
  static async renameConversation(conversationId: string, title: string): Promise<void> {
    const res = await fetch(`/api/conversations/${conversationId}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to rename conversation');
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete conversation');
    }
  }
}