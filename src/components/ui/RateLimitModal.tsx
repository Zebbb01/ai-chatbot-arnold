// =============================================================================
// src/components/ui/RateLimitModal.tsx - ENHANCED WITH COOLDOWN SUPPORT
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Clock, Zap, AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetTime: string;
  message?: string;
  nextAvailableAt?: string;
  modelSummary?: {
    availableModels: Array<{
      name: string;
      displayName: string;
      remaining: number;
      inCooldown: boolean;
      cooldownEndsAt?: string;
      minutesRemaining?: number;
    }>;
    allModelsExhausted: boolean;
    nextAvailableAt?: Date;
  };
}

const formatCooldownTime = (minutes: number) => {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} hours ${remainingMinutes} minutes` : `${hours} hours`;
};

const formatTimeUntil = (targetTime: string) => {
  const now = new Date();
  const target = new Date(targetTime);
  const diffMs = target.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Now';
  
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  return formatCooldownTime(diffMinutes);
};

export default function RateLimitModal({ 
  isOpen, 
  onClose, 
  resetTime, 
  message, 
  nextAvailableAt,
  modelSummary 
}: RateLimitModalProps) {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const updateCountdown = () => {
      const targetTime = nextAvailableAt || resetTime;
      setCountdown(formatTimeUntil(targetTime));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isOpen, nextAvailableAt, resetTime]);

  if (!isOpen) return null;

  const isAllExhausted = modelSummary?.allModelsExhausted;
  const hasModelsInCooldown = modelSummary?.availableModels?.some(model => model.inCooldown);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isAllExhausted ? 'All Models Unavailable' : 'Rate Limit Reached'}
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800 font-medium">
              {message || 'All available models are currently in cooldown or have reached their daily limits.'}
            </p>
          </div>

          {/* Model Status */}
          {modelSummary?.availableModels && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                Model Status
              </h3>
              <div className="space-y-2">
                {modelSummary.availableModels.map((model) => (
                  <div 
                    key={model.name}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {model.displayName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {model.remaining} requests remaining
                      </div>
                    </div>
                    <div className="text-right">
                      {model.inCooldown ? (
                        <div className="text-xs">
                          <div className="text-orange-600 font-medium">In Cooldown</div>
                          <div className="text-gray-500">
                            {model.cooldownEndsAt && formatTimeUntil(model.cooldownEndsAt)}
                          </div>
                        </div>
                      ) : model.remaining === 0 ? (
                        <div className="text-xs text-red-600 font-medium">
                          Daily Limit Reached
                        </div>
                      ) : (
                        <div className="text-xs text-green-600 font-medium">
                          Available
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Available Time */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-blue-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {hasModelsInCooldown && !isAllExhausted
                  ? 'Next Model Available In:'
                  : 'All Limits Reset In:'
                }
              </span>
            </div>
            <p className="text-blue-900 font-semibold mt-1">
              {countdown}
            </p>
            {nextAvailableAt && (
              <p className="text-blue-700 text-xs mt-1">
                Available at: {new Date(nextAvailableAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* How it works explanation */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">How the System Works:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Each model has a 3-hour cooldown after use</li>
              <li>• Models also have daily request limits</li>
              <li>• The system automatically uses the best available model</li>
              <li>• All limits reset daily at midnight</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t">
          <Button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}