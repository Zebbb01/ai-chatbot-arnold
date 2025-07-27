// =============================================================================
// src/components/ui/RateLimitModal.tsx - NEW COMPONENT
// =============================================================================

import React from 'react';
import { AlertTriangle, Clock, Zap } from 'lucide-react';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  resetTime: string;
  message?: string;
}

export default function RateLimitModal({ isOpen, onClose, resetTime, message }: RateLimitModalProps) {
  if (!isOpen) return null;

  const resetDate = new Date(resetTime);
  const now = new Date();
  const hoursUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Rate Limit Reached
            </h3>
            
            <p className="text-muted-foreground mb-4">
              {message || "You've reached your daily limit of requests. Your limit will reset soon."}
            </p>

            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Reset Time</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your requests will reset in approximately {hoursUntilReset} hour{hoursUntilReset !== 1 ? 's' : ''} 
                ({resetDate.toLocaleString()})
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Need More Requests?
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Consider upgrading to a premium plan for higher limits and additional features.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}