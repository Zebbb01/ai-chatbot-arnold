// src/types/chat.ts
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}