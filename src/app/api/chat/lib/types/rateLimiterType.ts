// src\app\api\chat\lib\types\rateLimiterType.ts
import { ModelConfig } from "./modelManagerType";

export interface RateLimitResult {
  allowed: boolean;
  selectedModel?: ModelConfig;
  remaining: number;
  resetTime: Date;
  message?: string;
  nextAvailableAt?: Date;
  modelSummary?: {
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
  };
}