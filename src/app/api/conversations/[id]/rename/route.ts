// src/app/api/conversations/[id]/rename/route.ts - Rename conversation
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

  const { title } = await req.json();
  const conversationId = params.id;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
  }

  try {
    // Verify the conversation belongs to the authenticated user and update
    const result = await db.update(conversations)
      .set({ title: title.trim() })
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      ))
      .returning({ id: conversations.id, title: conversations.title });

    if (!result.length) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied.' 
      }, { status: 403 });
    }

    return NextResponse.json({ success: true, title: result[0].title });
  } catch (error) {
    console.error('Error renaming conversation:', error);
    return NextResponse.json({ 
      error: 'Failed to rename conversation.' 
    }, { status: 500 });
  }
}