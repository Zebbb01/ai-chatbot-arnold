// =============================================================================
// src/app/api/user/usage/route.ts - FIXED WITH PROPER ERROR HANDLING
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { modelAwareRateLimiter } from '../../chat/lib/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const usageStats = await modelAwareRateLimiter.getUserUsageStats(userId);

    // Calculate legacy compatibility values
    const totalRemaining = usageStats.availableModels.reduce((sum, model) => sum + model.remaining, 0);
    const estimatedDailyLimit = usageStats.availableModels.reduce((sum, model, index) => {
      // Use the first available model's limit + current usage as baseline
      if (index === 0) return model.remaining + usageStats.totalRequestsToday;
      return sum;
    }, 50); // Fallback to 50

    return NextResponse.json({
      success: true,
      usage: {
        totalRequestsToday: usageStats.totalRequestsToday,
        currentModel: usageStats.currentModel,
        availableModels: usageStats.availableModels,
        resetTime: usageStats.resetTime.toISOString(),
        nextAvailableAt: usageStats.nextAvailableAt?.toISOString(),
        allModelsExhausted: usageStats.allModelsExhausted,
        // Legacy compatibility fields
        requests_today: usageStats.totalRequestsToday,
        requests_remaining: totalRemaining,
        daily_limit: estimatedDailyLimit,
        reset_time: usageStats.resetTime.toISOString()
      }
    });

  } catch (error) {
    console.error('Usage API error:', error);
    
    // Return safe fallback data
    const fallbackResetTime = new Date();
    fallbackResetTime.setDate(fallbackResetTime.getDate() + 1);
    fallbackResetTime.setHours(0, 0, 0, 0);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch usage statistics',
      usage: {
        totalRequestsToday: 0,
        currentModel: 'Error loading',
        availableModels: [],
        resetTime: fallbackResetTime.toISOString(),
        allModelsExhausted: true,
        requests_today: 0,
        requests_remaining: 0,
        daily_limit: 50,
        reset_time: fallbackResetTime.toISOString()
      }
    }, { status: 500 });
  }
}
