// src\app\api\chat\lib\types\modelManagerType.ts
export interface ModelConfig {
  name: string;
  displayName: string;
  dailyLimit: number;
  priority: number; // Lower number = higher priority
  cost: 'low' | 'high';
  cooldownHours: number; // Hours to wait after using this model
}

export interface ModelUsage {
  modelName: string;
  requestCount: number;
  lastRequestAt: Date;
  date: string;
}

export interface CooldownInfo {
  inCooldown: boolean;
  cooldownEndsAt?: Date;
  minutesRemaining?: number;
}

export interface ModelAvailability {
  model: ModelConfig;
  dailyUsage: number;
  dailyRemaining: number;
  cooldownInfo: CooldownInfo;
  isAvailable: boolean;
}