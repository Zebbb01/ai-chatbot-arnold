// =============================================================================
// src/app/api/user/usage/route.ts - NEW API ENDPOINT FOR USAGE STATS
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { rateLimiter } from '../../chat/lib/rate-limiter';
import {DEFAULT_RATE_LIMITS} from '../../chat/lib/rate-limiter'


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const usageStats = await rateLimiter.getUserUsageStats(session.user.id);

    return NextResponse.json({
      usage: {
        requests_today: usageStats.today,
        requests_remaining: usageStats.remaining,
        daily_limit: DEFAULT_RATE_LIMITS.maxRequestsPerDay,
        reset_time: usageStats.resetTime.toISOString(),
      }
    });

  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json({
      error: 'Failed to fetch usage statistics'
    }, { status: 500 });
  }
}