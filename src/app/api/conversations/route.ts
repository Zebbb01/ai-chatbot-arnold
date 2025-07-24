// src/app/api/conversations/route.ts - Enhanced with pin functionality
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * Handles GET requests to fetch all conversations for a given user.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const userConversations = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        isPinned: conversations.isPinned,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(eq(conversations.userId, session.user.id))
      .orderBy(desc(conversations.createdAt)); // Show newest first

    return NextResponse.json(userConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations.' }, { status: 500 });
  }
}