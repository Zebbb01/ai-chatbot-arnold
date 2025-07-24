// src/app/api/debug/auth-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { accounts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const debugInfo: {
      hasSession: boolean;
      userId: string | null;
      hasAccessToken: boolean;
      accessTokenLength: number;
      userEmail: string | null;
      accountsInDb?: number;
      googleAccount?: {
        hasAccessToken: boolean;
        hasRefreshToken: boolean;
        expiresAt: number | null;
      } | null;
    } = {
      hasSession: !!session,
      userId: session?.user?.id || null,
      hasAccessToken: !!session?.accessToken,
      accessTokenLength: session?.accessToken?.length || 0,
      userEmail: session?.user?.email || null,
    };

    // If we have a userId, check the database
    if (session?.user?.id) {
      const userAccounts = await db
        .select({ 
          access_token: accounts.access_token,
          provider: accounts.provider,
          userId: accounts.userId,
          expires_at: accounts.expires_at,
          refresh_token: accounts.refresh_token
        })
        .from(accounts)
        .where(eq(accounts.userId, session.user.id));
      
      debugInfo.accountsInDb = userAccounts.length;
      
      const googleAccount = userAccounts.find(acc => acc.provider === 'google');
      debugInfo.googleAccount = googleAccount ? {
        hasAccessToken: !!googleAccount.access_token,
        hasRefreshToken: !!googleAccount.refresh_token,
        expiresAt: googleAccount.expires_at,
      } : null;
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Error in auth debug:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}