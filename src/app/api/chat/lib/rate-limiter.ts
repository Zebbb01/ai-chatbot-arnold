// =============================================================================
// src/app/api/chat/lib/rate-limiter.ts - FIXED WITH PROPER DISPLAY AND LIMITS
// =============================================================================

import { db } from '@/lib/db';
import { modelUsage } from '@/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import { ModelConfig, ModelUsage, RateLimitResult } from './types/';
import { modelManager } from './model-manager';

export class ModelAwareRateLimiter {
  async checkRateLimit(userId: string): Promise<RateLimitResult> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
      // Get all model usage for today
      const todayUsages = await db
        .select()
        .from(modelUsage)
        .where(and(
          eq(modelUsage.userId, userId),
          eq(modelUsage.date, today)
        ));

      // FIXED: Properly map all fields including lastRequestAt
      const modelUsages: ModelUsage[] = todayUsages.map(usage => ({
        modelName: usage.modelName,
        requestCount: usage.requestCount ?? 0,
        lastRequestAt: usage.lastRequestAt || new Date(0), // Provide default if null
        date: usage.date
      }));

      // Get availability information from model manager
      const availabilityResult = await modelManager.getAvailableModel(userId, modelUsages);
      
      if (!availabilityResult.model) {
        const resetTime = new Date(now);
        resetTime.setDate(resetTime.getDate() + 1);
        resetTime.setHours(0, 0, 0, 0);

        // Build enhanced model summary with cooldown info
        const modelSummary = {
          currentModel: 'No models available',
          totalRequestsToday: modelUsages.reduce((sum, usage) => sum + usage.requestCount, 0),
          availableModels: availabilityResult.availability.map(item => ({
            name: item.model.name,
            remaining: item.dailyRemaining,
            displayName: item.model.displayName,
            inCooldown: item.cooldownInfo.inCooldown,
            cooldownEndsAt: item.cooldownInfo.cooldownEndsAt?.toISOString(),
            minutesRemaining: item.cooldownInfo.minutesRemaining
          })),
          nextAvailableAt: availabilityResult.nextAvailableAt,
          allModelsExhausted: availabilityResult.allModelsExhausted
        };

        return {
          allowed: false,
          selectedModel: undefined,
          remaining: 0,
          resetTime,
          message: availabilityResult.nextAvailableAt 
            ? `All models in cooldown. Next available at ${availabilityResult.nextAvailableAt.toLocaleTimeString()}`
            : 'All model limits exceeded for today. Resets at midnight.',
          nextAvailableAt: availabilityResult.nextAvailableAt,
          modelSummary
        };
      }

      // Get current usage for the selected model
      const selectedModel = availabilityResult.model;
      const currentModelUsage = modelUsages.find(
        usage => usage.modelName === selectedModel.name
      );
      const currentUsage = currentModelUsage?.requestCount || 0;
      const remaining = Math.max(0, selectedModel.dailyLimit - currentUsage - 1);

      const resetTime = new Date(now);
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);

      // Build model summary for successful case
      const modelSummary = {
        currentModel: selectedModel.displayName,
        totalRequestsToday: modelUsages.reduce((sum, usage) => sum + usage.requestCount, 0),
        availableModels: availabilityResult.availability.map(item => ({
          name: item.model.name,
          remaining: item.dailyRemaining,
          displayName: item.model.displayName,
          inCooldown: item.cooldownInfo.inCooldown,
          cooldownEndsAt: item.cooldownInfo.cooldownEndsAt?.toISOString(),
          minutesRemaining: item.cooldownInfo.minutesRemaining
        })),
        nextAvailableAt: availabilityResult.nextAvailableAt,
        allModelsExhausted: false
      };

      return {
        allowed: true,
        selectedModel,
        remaining,
        resetTime,
        modelSummary
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      
      // On error, return fallback
      const resetTime = new Date();
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);
      
      return {
        allowed: true,
        selectedModel: modelManager.getDefaultModel(),
        remaining: 0,
        resetTime,
        message: 'Error checking rate limits. Using default model.'
      };
    }
  }

  async incrementUsage(userId: string, modelName: string): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
      await db
        .insert(modelUsage)
        .values({
          userId,
          modelName,
          date: today,
          requestCount: 1,
          lastRequestAt: now,
        })
        .onConflictDoUpdate({
          target: [modelUsage.userId, modelUsage.modelName, modelUsage.date],
          set: {
            requestCount: sql`${modelUsage.requestCount} + 1`,
            lastRequestAt: now,
            updatedAt: now,
          },
        });
    } catch (error) {
      console.error('Failed to increment model usage:', error);
      
      // Fallback: manual increment
      try {
        const currentUsage = await db
          .select({ requestCount: modelUsage.requestCount })
          .from(modelUsage)
          .where(and(
            eq(modelUsage.userId, userId),
            eq(modelUsage.modelName, modelName),
            eq(modelUsage.date, today)
          ))
          .limit(1);

        const currentCount = currentUsage[0]?.requestCount ?? 0;

        await db
          .update(modelUsage)
          .set({
            requestCount: currentCount + 1,
            lastRequestAt: now,
            updatedAt: now,
          })
          .where(and(
            eq(modelUsage.userId, userId),
            eq(modelUsage.modelName, modelName),
            eq(modelUsage.date, today)
          ));
      } catch (fallbackError) {
        console.error('Fallback increment also failed:', fallbackError);
      }
    }
  }

  async getUserUsageStats(userId: string): Promise<{
    totalRequestsToday: number;
    currentModel: string;
    availableModels: { 
      name: string; 
      remaining: number; 
      displayName: string;
      inCooldown: boolean;
      cooldownEndsAt?: string;
      minutesRemaining?: number;
    }[];
    resetTime: Date;
    nextAvailableAt?: Date;
    allModelsExhausted: boolean;
  }> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
      const todayUsages = await db
        .select()
        .from(modelUsage)
        .where(and(
          eq(modelUsage.userId, userId),
          eq(modelUsage.date, today)
        ));

      // FIXED: Properly map all fields
      const modelUsages: ModelUsage[] = todayUsages.map(usage => ({
        modelName: usage.modelName,
        requestCount: usage.requestCount ?? 0,
        lastRequestAt: usage.lastRequestAt || new Date(0),
        date: usage.date
      }));

      const availabilityResult = await modelManager.getAvailableModel(userId, modelUsages);
      
      const resetTime = new Date(now);
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);

      const totalRequestsToday = modelUsages.reduce((sum, usage) => sum + usage.requestCount, 0);
      const currentModel = availabilityResult.model?.displayName || 'No models available';

      const availableModels = availabilityResult.availability.map(item => ({
        name: item.model.name,
        remaining: item.dailyRemaining,
        displayName: item.model.displayName,
        inCooldown: item.cooldownInfo.inCooldown,
        cooldownEndsAt: item.cooldownInfo.cooldownEndsAt?.toISOString(),
        minutesRemaining: item.cooldownInfo.minutesRemaining
      }));

      return {
        totalRequestsToday,
        currentModel,
        availableModels,
        resetTime,
        nextAvailableAt: availabilityResult.nextAvailableAt,
        allModelsExhausted: availabilityResult.allModelsExhausted
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      const resetTime = new Date();
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);
      
      return {
        totalRequestsToday: 0,
        currentModel: 'Error loading models',
        availableModels: [],
        resetTime,
        allModelsExhausted: true
      };
    }
  }

  // NEW: Method for debug route
  async getDetailedModelStatus(userId: string): Promise<{
    userId: string;
    timestamp: string;
    modelAvailability: any[];
    rawUsageData: any[];
    nextAvailable: any;
  }> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
      // Get raw usage data
      const todayUsages = await db
        .select()
        .from(modelUsage)
        .where(and(
          eq(modelUsage.userId, userId),
          eq(modelUsage.date, today)
        ));

      const modelUsages: ModelUsage[] = todayUsages.map(usage => ({
        modelName: usage.modelName,
        requestCount: usage.requestCount ?? 0,
        lastRequestAt: usage.lastRequestAt || new Date(0),
        date: usage.date
      }));

      // Get detailed availability
      const availabilityResult = await modelManager.getAvailableModel(userId, modelUsages);
      const nextAvailable = modelManager.getNextAvailableModel(modelUsages);

      return {
        userId,
        timestamp: now.toISOString(),
        modelAvailability: availabilityResult.availability.map(item => ({
          modelName: item.model.name,
          displayName: item.model.displayName,
          dailyLimit: item.model.dailyLimit,
          dailyUsage: item.dailyUsage,
          dailyRemaining: item.dailyRemaining,
          isAvailable: item.isAvailable,
          cooldownInfo: {
            inCooldown: item.cooldownInfo.inCooldown,
            cooldownEndsAt: item.cooldownInfo.cooldownEndsAt?.toISOString(),
            minutesRemaining: item.cooldownInfo.minutesRemaining
          },
          priority: item.model.priority,
          cost: item.model.cost
        })),
        rawUsageData: todayUsages.map(usage => ({
          modelName: usage.modelName,
          requestCount: usage.requestCount,
          lastRequestAt: usage.lastRequestAt?.toISOString(),
          date: usage.date
        })),
        nextAvailable: {
          model: nextAvailable.model?.displayName,
          availableAt: nextAvailable.availableAt?.toISOString(),
          reason: nextAvailable.reason
        }
      };
    } catch (error) {
      console.error('Failed to get detailed model status:', error);
      return {
        userId,
        timestamp: now.toISOString(),
        modelAvailability: [],
        rawUsageData: [],
        nextAvailable: {
          model: null,
          availableAt: null,
          reason: 'error'
        }
      };
    }
  }
}


// Export a default instance
export const modelAwareRateLimiter = new ModelAwareRateLimiter();
