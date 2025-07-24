// src/app/api/conversations/[id]/route.ts - Delete conversation
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages, schedules } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const conversationId = params.id;

  try {
    // Verify the conversation belongs to the authenticated user
    const conversation = await db.select({
      userId: conversations.userId
    }).from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation.length || conversation[0].userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied.' 
      }, { status: 403 });
    }

    // Delete related schedules first
    await db.delete(schedules)
      .where(eq(schedules.conversationId, conversationId));

    // Delete related messages
    await db.delete(messages)
      .where(eq(messages.conversationId, conversationId));

    // Delete the conversation
    await db.delete(conversations)
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ 
      error: 'Failed to delete conversation.' 
    }, { status: 500 });
  }
}