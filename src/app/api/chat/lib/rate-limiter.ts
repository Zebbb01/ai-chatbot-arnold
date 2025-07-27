// =============================================================================
// src/app/api/chat/lib/rate-limiter.ts - NEW FILE
// =============================================================================

import { db } from '@/lib/db';
import { userUsage } from '@/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface RateLimitConfig {
    maxRequestsPerDay: number;
    maxRequestsPerHour: number;
    maxRequestsPerMinute: number;
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
    maxRequestsPerDay: 30,    // 50 requests per day for free tier
    maxRequestsPerHour: 10,   // 20 requests per hour
    maxRequestsPerMinute: 5,  // 5 requests per minute
};

export const PREMIUM_RATE_LIMITS: RateLimitConfig = {
    maxRequestsPerDay: 500,   // 500 requests per day for premium
    maxRequestsPerHour: 100,  // 100 requests per hour
    maxRequestsPerMinute: 20, // 20 requests per minute
};

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    message?: string;
}

export class RateLimiter {
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig = DEFAULT_RATE_LIMITS) {
        this.config = config;
    }

    async checkRateLimit(userId: string): Promise<RateLimitResult> {
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

        try {
            // Get or create today's usage record
            let usageRecord = await db
                .select()
                .from(userUsage)
                .where(and(
                    eq(userUsage.userId, userId),
                    eq(userUsage.date, today)
                ))
                .limit(1);

            let currentUsage = usageRecord[0];

            if (!currentUsage) {
                // Create new usage record for today
                const newUsage = await db
                    .insert(userUsage)
                    .values({
                        userId,
                        date: today,
                        requestCount: 0,
                        lastRequestAt: now,
                    })
                    .returning();

                currentUsage = newUsage[0];
            }

            // Ensure currentUsage is not undefined before proceeding, though the logic above should handle it
            if (!currentUsage) {
                throw new Error("Failed to retrieve or create user usage record.");
            }

            // Check daily limit
            // Access requestCount with nullish coalescing or a type assertion if you are certain it's always there after the above logic
            if ((currentUsage.requestCount ?? 0) >= this.config.maxRequestsPerDay) { // <--- Fixed here
                const resetTime = new Date(now);
                resetTime.setDate(resetTime.getDate() + 1);
                resetTime.setHours(0, 0, 0, 0);

                return {
                    allowed: false,
                    remaining: 0,
                    resetTime,
                    message: `Daily limit of ${this.config.maxRequestsPerDay} requests exceeded. Resets at midnight.`
                };
            }

            // Check hourly limit (simplified, as per your code's current implementation)
            const hourlyCheck = await this.checkHourlyLimit(userId, now);
            if (!hourlyCheck.allowed) {
                return hourlyCheck;
            }

            // Check minute limit (simplified, as per your code's current implementation)
            const minuteCheck = await this.checkMinuteLimit(userId, now);
            if (!minuteCheck.allowed) {
                return minuteCheck;
            }

            // All checks passed
            // Access requestCount with nullish coalescing
            const remaining = this.config.maxRequestsPerDay - (currentUsage.requestCount ?? 0) - 1; // <--- Fixed here
            const resetTime = new Date(now);
            resetTime.setDate(resetTime.getDate() + 1);
            resetTime.setHours(0, 0, 0, 0);

            return {
                allowed: true,
                remaining,
                resetTime,
            };

        } catch (error) {
            console.error('Rate limit check failed:', error);
            // On error, allow the request but log it
            return {
                allowed: true,
                remaining: 0,
                resetTime: new Date(),
            };
        }
    }

    private async checkHourlyLimit(userId: string, now: Date): Promise<RateLimitResult> {
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // In a production app, you'd want a more sophisticated tracking system
        // For now, we'll use a simple in-memory cache or Redis
        // This is a simplified version - consider using Redis for production

        const resetTime = new Date(now);
        resetTime.setHours(resetTime.getHours() + 1, 0, 0, 0);

        return {
            allowed: true,
            remaining: this.config.maxRequestsPerHour,
            resetTime,
        };
    }

    private async checkMinuteLimit(userId: string, now: Date): Promise<RateLimitResult> {
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

        const resetTime = new Date(now);
        resetTime.setMinutes(resetTime.getMinutes() + 1, 0, 0);

        return {
            allowed: true,
            remaining: this.config.maxRequestsPerMinute,
            resetTime,
        };
    }

    async incrementUsage(userId: string): Promise<void> {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        try {
            // Use SQL increment for atomic operation
            await db
                .insert(userUsage)
                .values({
                    userId,
                    date: today,
                    requestCount: 1,
                    lastRequestAt: now,
                })
                .onConflictDoUpdate({
                    target: [userUsage.userId, userUsage.date],
                    set: {
                        requestCount: sql`${userUsage.requestCount} + 1`,
                        lastRequestAt: now,
                        updatedAt: now,
                    },
                });
        } catch (error) {
            console.error('Failed to increment usage:', error);

            // Fallback: manual increment if the above fails
            try {
                const currentUsage = await db
                    .select({ requestCount: userUsage.requestCount })
                    .from(userUsage)
                    .where(and(
                        eq(userUsage.userId, userId),
                        eq(userUsage.date, today)
                    ))
                    .limit(1);

                const currentCount = currentUsage[0]?.requestCount ?? 0; // Safely access with optional chaining and nullish coalescing

                await db
                    .update(userUsage)
                    .set({
                        requestCount: currentCount + 1,
                        lastRequestAt: now,
                        updatedAt: now,
                    })
                    .where(and(
                        eq(userUsage.userId, userId),
                        eq(userUsage.date, today)
                    ));
            } catch (fallbackError) {
                console.error('Fallback increment also failed:', fallbackError);
            }
        }
    }

    async getUserUsageStats(userId: string): Promise<{
        today: number;
        remaining: number;
        resetTime: Date;
    }> {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        try {
            const usage = await db
                .select()
                .from(userUsage)
                .where(and(
                    eq(userUsage.userId, userId),
                    eq(userUsage.date, today)
                ))
                .limit(1);

            // Safely access requestCount, defaulting to 0 if null/undefined
            const currentUsageCount = usage[0]?.requestCount ?? 0; // <--- Fixed here
            const remaining = Math.max(0, this.config.maxRequestsPerDay - currentUsageCount);

            const resetTime = new Date(now);
            resetTime.setDate(resetTime.getDate() + 1);
            resetTime.setHours(0, 0, 0, 0);

            return {
                today: currentUsageCount,
                remaining,
                resetTime,
            };
        } catch (error) {
            console.error('Failed to get usage stats:', error);
            return {
                today: 0,
                remaining: this.config.maxRequestsPerDay,
                resetTime: new Date(),
            };
        }
    }
}

// Export a default instance
export const rateLimiter = new RateLimiter(DEFAULT_RATE_LIMITS);