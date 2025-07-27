// =============================================================================
// src/components/ui/UsageIndicator.tsx - NEW COMPONENT
// =============================================================================

import React from 'react';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { useRateLimit } from '@/hooks/useRateLimit';

export default function UsageIndicator() {
  const { usage, loading } = useRateLimit();

  if (loading || !usage) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Zap className="w-4 h-4 animate-pulse" />
        <span>Loading usage...</span>
      </div>
    );
  }

  const percentage = ((usage.daily_limit - usage.requests_remaining) / usage.daily_limit) * 100;
  const isLowRemaining = usage.requests_remaining <= 5;
  const isVeryLowRemaining = usage.requests_remaining <= 1;

  const resetTime = new Date(usage.reset_time);
  const now = new Date();
  const hoursUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <div className="flex items-center space-x-2 text-sm">
      {isVeryLowRemaining ? (
        <AlertTriangle className="w-4 h-4 text-red-500" />
      ) : isLowRemaining ? (
        <AlertTriangle className="w-4 h-4 text-orange-500" />
      ) : (
        <Zap className="w-4 h-4 text-green-500" />
      )}
      
      <div className="flex items-center space-x-1">
        <span className={`font-medium ${
          isVeryLowRemaining ? 'text-red-600' : 
          isLowRemaining ? 'text-orange-600' : 
          'text-green-600'
        }`}>
          {usage.requests_remaining}
        </span>
        <span className="text-muted-foreground">/ {usage.daily_limit} requests left</span>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 max-w-[100px]">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isVeryLowRemaining ? 'bg-red-500' :
              isLowRemaining ? 'bg-orange-500' :
              'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Reset Time */}
      <div className="flex items-center space-x-1 text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span className="text-xs">
          Resets in {hoursUntilReset}h
        </span>
      </div>
    </div>
  );
}