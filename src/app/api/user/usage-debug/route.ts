// =============================================================================
// src/app/api/user/usage-debug/route.ts - DEBUG ROUTE FOR MONITORING COOLDOWNS
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { modelAwareRateLimiter } from '../../chat/lib/rate-limiter';
import { Session } from 'next-auth'; // Import Session type

// =============================================================================
// src/app/api/user/usage-debug/route.ts - ENHANCED DEBUG ENDPOINT
// =============================================================================

export async function GET(req: NextRequest) {
  let session: Session | null = null; // Declare session with a wider scope and initialize to null

  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get detailed model status for debugging
    const detailedStatus = await modelAwareRateLimiter.getDetailedModelStatus(userId);

    // Get current rate limit result
    const rateLimitResult = await modelAwareRateLimiter.checkRateLimit(userId);

    // Get usage stats
    const usageStats = await modelAwareRateLimiter.getUserUsageStats(userId);

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        timestamp: new Date().toISOString(),
        detailedStatus,
        rateLimitResult: {
          allowed: rateLimitResult.allowed,
          selectedModel: rateLimitResult.selectedModel ? {
            name: rateLimitResult.selectedModel.name,
            displayName: rateLimitResult.selectedModel.displayName,
            cost: rateLimitResult.selectedModel.cost,
            dailyLimit: rateLimitResult.selectedModel.dailyLimit,
            priority: rateLimitResult.selectedModel.priority
          } : null,
          remaining: rateLimitResult.remaining,
          message: rateLimitResult.message,
          nextAvailableAt: rateLimitResult.nextAvailableAt?.toISOString(),
          resetTime: rateLimitResult.resetTime.toISOString(),
          modelSummary: rateLimitResult.modelSummary
        },
        usageStats: {
          ...usageStats,
          resetTime: usageStats.resetTime.toISOString(),
          nextAvailableAt: usageStats.nextAvailableAt?.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Usage debug API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch debug usage statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id || 'N/A', // Access session safely
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST endpoint for testing and manual operations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { action, modelName } = await req.json();
    const userId = session.user.id;

    switch (action) {
      case 'simulate_usage':
        if (modelName) {
          await modelAwareRateLimiter.incrementUsage(userId, modelName);
          return NextResponse.json({
            success: true,
            message: `Simulated usage for ${modelName}`,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'get_status':
        const status = await modelAwareRateLimiter.checkRateLimit(userId);
        return NextResponse.json({
          success: true,
          status: {
            allowed: status.allowed,
            selectedModel: status.selectedModel?.displayName,
            remaining: status.remaining,
            message: status.message
          }
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['simulate_usage', 'get_status']
        }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Action not implemented'
    }, { status: 400 });

  } catch (error) {
    console.error('Usage debug POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process debug action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}