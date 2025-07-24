// src/app/api/conversations/[id]/pin/route.ts - Pin/Unpin conversation
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { isPinned } = await req.json();
  const conversationId = params.id;

  try {
    // Verify the conversation belongs to the authenticated user and update
    const result = await db.update(conversations)
      .set({ isPinned: isPinned })
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      ))
      .returning({ id: conversations.id });

    if (!result.length) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied.' 
      }, { status: 403 });
    }

    return NextResponse.json({ success: true, isPinned });
  } catch (error) {
    console.error('Error updating conversation pin status:', error);
    return NextResponse.json({ 
      error: 'Failed to update conversation.' 
    }, { status: 500 });
  }
}