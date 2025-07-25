// src/app/api/conversations/[id]/pin/route.ts - Fixed for Next.js 15
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
 
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { isPinned } = await req.json();
  // Await params before accessing properties (Next.js 15 requirement)
  const { id: conversationId } = await params;

  try {
    // Verify the conversation belongs to the authenticated user and update
    const result = await db.update(conversations)
      .set({ 
        isPinned: isPinned,
        updatedAt: new Date()
      })
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