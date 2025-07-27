// =============================================================================
// src/app/api/chat/lib/model-manager.ts - FIXED: Only cooldown when limit reached
// =============================================================================

import { CooldownInfo, ModelUsage, ModelAvailability, ModelConfig } from "./types/";

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    name: 'openai/gpt-4.1',
    displayName: 'GPT-4.1 (Premium)',
    dailyLimit: 10,
    priority: 1,
    cost: 'high',
    cooldownHours: 3
  },
  {
    name: 'openai/gpt-4.1-mini',
    displayName: 'GPT-4.1 Mini',
    dailyLimit: 50,
    priority: 2,
    cost: 'low',
    cooldownHours: 3
  },
  {
    name: 'openai/gpt-4.1-nano',
    displayName: 'GPT-4.1 Nano',
    dailyLimit: 50,
    priority: 3,
    cost: 'low',
    cooldownHours: 3
  },
  {
    name: 'xai/grok-3-mini',
    displayName: 'Grok-3 Mini',
    dailyLimit: 50,
    priority: 4,
    cost: 'low',
    cooldownHours: 3
  },
];

export class ModelManager {
  private models: ModelConfig[];

  constructor(models: ModelConfig[] = AVAILABLE_MODELS) {
    this.models = models.sort((a, b) => a.priority - b.priority);
  }

  /**
   * FIXED: Only check cooldown if model has reached its daily limit
   */
  private isModelInCooldown(model: ModelConfig, dailyUsage: number, lastRequestAt?: Date): CooldownInfo {
    // Only apply cooldown if the model has reached its daily limit
    if (dailyUsage < model.dailyLimit) {
      return { inCooldown: false };
    }

    if (!lastRequestAt) {
      return { inCooldown: false };
    }

    const now = new Date();
    const cooldownEndTime = new Date(lastRequestAt.getTime() + (model.cooldownHours * 60 * 60 * 1000));
    const isInCooldown = now < cooldownEndTime;

    if (isInCooldown) {
      const minutesRemaining = Math.ceil((cooldownEndTime.getTime() - now.getTime()) / (60 * 1000));
      return {
        inCooldown: true,
        cooldownEndsAt: cooldownEndTime,
        minutesRemaining: Math.max(1, minutesRemaining)
      };
    }

    return { inCooldown: false };
  }

  getDefaultModel(): ModelConfig {
    return this.models[0] || {
      name: 'openai/gpt-4.1',
      displayName: 'GPT-4.1 (Premium)',
      dailyLimit: 10,
      priority: 1,
      cost: 'high',
      cooldownHours: 3
    };
  }

  /**
   * FIXED: Better model availability checking - only cooldown when limit reached
   */
  getModelAvailability(modelUsages: ModelUsage[]): ModelAvailability[] {
    const today = new Date().toISOString().split('T')[0];
    
    return this.models.map(model => {
      const todayUsage = modelUsages.find(
        usage => usage.modelName === model.name && usage.date === today
      );
      
      const dailyUsage = todayUsage?.requestCount || 0;
      const dailyRemaining = Math.max(0, model.dailyLimit - dailyUsage);
      
      // FIXED: Pass dailyUsage to cooldown check
      const cooldownInfo = this.isModelInCooldown(
        model, 
        dailyUsage, 
        todayUsage?.lastRequestAt
      );
      
      // Model is available if it has remaining requests and is not in cooldown
      const isAvailable = dailyRemaining > 0 && !cooldownInfo.inCooldown;

      return {
        model,
        dailyUsage,
        dailyRemaining,
        cooldownInfo,
        isAvailable
      };
    });
  }

  /**
   * Get the best available model based on usage limits and cooldowns
   */
  async getAvailableModel(userId: string, modelUsages: ModelUsage[]): Promise<{
    model: ModelConfig | null;
    availability: ModelAvailability[];
    allModelsExhausted: boolean;
    nextAvailableAt?: Date;
  }> {
    const availability = this.getModelAvailability(modelUsages);
    
    // Find first available model (not in cooldown and has remaining requests)
    const availableModel = availability.find(item => item.isAvailable);
    
    if (availableModel) {
      return {
        model: availableModel.model,
        availability,
        allModelsExhausted: false
      };
    }

    // No models available - find when next one becomes available
    let nextAvailableAt: Date;

    // Find earliest availability time
    const earliestCooldownEnd = availability
      .filter(item => item.cooldownInfo.cooldownEndsAt)
      .sort((a, b) => a.cooldownInfo.cooldownEndsAt!.getTime() - b.cooldownInfo.cooldownEndsAt!.getTime())[0];

    if (earliestCooldownEnd?.cooldownInfo.cooldownEndsAt) {
      // Some model will be available when cooldown ends
      nextAvailableAt = earliestCooldownEnd.cooldownInfo.cooldownEndsAt;
    } else {
      // All models have exhausted daily limits - wait until tomorrow
      nextAvailableAt = new Date();
      nextAvailableAt.setDate(nextAvailableAt.getDate() + 1);
      nextAvailableAt.setHours(0, 0, 0, 0);
    }

    // Check if all models are truly exhausted (both daily limit and cooldown)
    const allModelsExhausted = availability.every(item => 
      item.dailyRemaining === 0 || item.cooldownInfo.inCooldown
    );

    return {
      model: null,
      availability,
      allModelsExhausted,
      nextAvailableAt
    };
  }

  /**
   * Get usage summary for a user with cooldown information
   */
  getUserModelSummary(modelUsages: ModelUsage[]): {
    currentModel: string;
    totalRequestsToday: number;
    availableModels: { 
      name: string; 
      remaining: number; 
      displayName: string;
      inCooldown: boolean;
      cooldownEndsAt?: string;
      minutesRemaining?: number;
    }[];
    nextAvailableAt?: Date;
    allModelsExhausted: boolean;
  } {
    const availability = this.getModelAvailability(modelUsages);
    const totalRequestsToday = availability.reduce((sum, item) => sum + item.dailyUsage, 0);
    
    // Find the first available model (highest priority)
    const availableModel = availability.find(item => item.isAvailable);
    const currentModel = availableModel?.model.displayName || 'No models available';
    
    const availableModels = availability.map(item => ({
      name: item.model.name,
      displayName: item.model.displayName,
      remaining: item.dailyRemaining,
      inCooldown: item.cooldownInfo.inCooldown,
      cooldownEndsAt: item.cooldownInfo.cooldownEndsAt?.toISOString(),
      minutesRemaining: item.cooldownInfo.minutesRemaining
    }));

    // Find next available time
    let nextAvailableAt: Date | undefined;
    const allModelsExhausted = !availableModel;

    if (allModelsExhausted) {
      // Find the earliest time when a model becomes available
      const nextCooldownEnd = availability
        .filter(item => item.cooldownInfo.cooldownEndsAt)
        .sort((a, b) => a.cooldownInfo.cooldownEndsAt!.getTime() - b.cooldownInfo.cooldownEndsAt!.getTime())[0];

      if (nextCooldownEnd?.cooldownInfo.cooldownEndsAt) {
        nextAvailableAt = nextCooldownEnd.cooldownInfo.cooldownEndsAt;
      } else {
        // All daily limits reached - wait until tomorrow
        nextAvailableAt = new Date();
        nextAvailableAt.setDate(nextAvailableAt.getDate() + 1);
        nextAvailableAt.setHours(0, 0, 0, 0);
      }
    }

    return {
      currentModel,
      totalRequestsToday,
      availableModels,
      nextAvailableAt,
      allModelsExhausted
    };
  }

  /**
   * Check if any model is available for the user
   */
  async hasAvailableModel(userId: string, modelUsages: ModelUsage[]): Promise<boolean> {
    const availability = this.getModelAvailability(modelUsages);
    return availability.some(item => item.isAvailable);
  }

  /**
   * Get next model that will become available
   */
  getNextAvailableModel(modelUsages: ModelUsage[]): {
    model: ModelConfig | null;
    availableAt: Date | null;
    reason: 'cooldown' | 'daily_reset' | 'available_now';
  } {
    const availability = this.getModelAvailability(modelUsages);
    
    // Check if any model is available right now
    const currentlyAvailable = availability.find(item => item.isAvailable);
    if (currentlyAvailable) {
      return {
        model: currentlyAvailable.model,
        availableAt: new Date(),
        reason: 'available_now'
      };
    }

    // Find models that will be available after cooldown
    const cooldownModels = availability
      .filter(item => item.cooldownInfo.cooldownEndsAt && item.dailyRemaining > 0)
      .sort((a, b) => a.cooldownInfo.cooldownEndsAt!.getTime() - b.cooldownInfo.cooldownEndsAt!.getTime());

    if (cooldownModels.length > 0) {
      return {
        model: cooldownModels[0].model,
        availableAt: cooldownModels[0].cooldownInfo.cooldownEndsAt!,
        reason: 'cooldown'
      };
    }

    // All models exhausted daily limits - next available at midnight
    const midnight = new Date();
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);

    return {
      model: this.models[0], // Highest priority model
      availableAt: midnight,
      reason: 'daily_reset'
    };
  }
}

// Export default instance
export const modelManager = new ModelManager();