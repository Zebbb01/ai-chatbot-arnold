// src/lib/chat/chat-api.ts
import { Message } from '@/types/chat';

export async function getChatHistory(conversationId: string): Promise<Message[]> {
  try {
    const response = await fetch(`/api/chat/history?conversationId=${conversationId}`);
    if (!response.ok) {
      console.error("Failed to fetch chat history");
      return [];
    }
    return response.json();
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    return [];
  }
}