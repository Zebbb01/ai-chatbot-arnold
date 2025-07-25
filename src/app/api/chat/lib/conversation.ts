// =============================================================================
// src/app/api/chat/lib/conversation.ts
// =============================================================================
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { messages, conversations } from '@/drizzle/schema';
import { eq, asc } from 'drizzle-orm';

export async function getOrCreateConversation(conversationId: string | null, userId: string, userMessage: string): Promise<string> {
  if (conversationId) return conversationId;

  const newId = uuidv4();
  await db.insert(conversations).values({
    id: newId,
    userId,
    title: userMessage.substring(0, 40) || 'Chat Session',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return newId;
}

export async function getConversationHistory(conversationId: string) {
  return db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(10);
}

export async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
  await db.insert(messages).values({
    conversationId,
    role,
    content,
    createdAt: new Date(),
  });
}