// =============================================================================
// src/components/chat/ChatInput.tsx - FIXED WITH PROPER RATE LIMIT HANDLING
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useAutosizeTextarea } from '@/hooks/useAutosizeTextarea';
import { Send, Paperclip, Mic, Clock, AlertCircle, CheckCircle, XCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { useNotification } from '@/providers/NotificationProvider';
import { useRateLimit } from '@/hooks/useRateLimit';
import RateLimitModal from '@/components/ui/RateLimitModal';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
}

const getCostIcon = (cost: string) => {
  switch (cost) {
    case 'low': return <span className="w-2 h-2 rounded-full bg-blue-500" />;
    case 'high': return <span className="w-2 h-2 rounded-full bg-purple-500" />;
    default: return <span className="w-2 h-2 rounded-full bg-gray-500" />;
  }
};

const getCostColor = (cost: string) => {
  switch (cost) {
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'high': return 'text-purple-600 bg-purple-50 border-purple-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const formatCooldownTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const getModelStatusIcon = (model: any) => {
  // FIXED: Better status checking logic
  if (model.inCooldown) {
    return <Clock className="w-3 h-3 text-orange-500" />;
  } else if (model.remaining > 0) {
    return <CheckCircle className="w-3 h-3 text-green-500" />;
  } else {
    return <XCircle className="w-3 h-3 text-red-500" />;
  }
};

// FIXED: Determine model cost based on actual model data
const getModelCost = (model: any, index: number) => {
  // Map known models to their costs
  const costMapping: { [key: string]: string } = {
    'openai/gpt-4.1': 'high',
    'openai/gpt-4.1-mini': 'low',
    'openai/gpt-4.1-nano': 'low',
    'xai/grok-3-mini': 'low'
  };
  
  return costMapping[model.name] || (index === 0 ? 'high' : 'low');
};

export default function ChatInput({ input, setInput, sendMessage, isLoading }: ChatInputProps) {
  const textareaRef = useAutosizeTextarea({ value: input, maxHeight: 200 });
  const { addNotification } = useNotification();
  
  // Rate limiting state with enhanced usage info
  const { usage, refetch } = useRateLimit();
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModelStatusVisible, setIsModelStatusVisible] = useState(false);

  // Update current time every minute to refresh cooldown displays
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && input.trim() !== '') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;
    
    // FIXED: Better availability checking
    const availableModels = usage?.availableModels?.filter(model => 
      !model.inCooldown && model.remaining > 0
    ) || [];
    
    if (availableModels.length === 0) {
      setShowRateLimitModal(true);
      return;
    }

    // Enhanced warning system
    if (availableModels.length === 1) {
      const lastAvailable = availableModels[0];
      if (lastAvailable.remaining <= 3) {
        addNotification(
          'warning',
          'Low Usage Warning',
          `Only ${lastAvailable.remaining} requests left on ${lastAvailable.displayName}. After use, this model will be in cooldown for 3 hours.`,
          8000
        );
      }
    }

    // Show next available model info
    const modelsInCooldown = usage?.availableModels?.filter(model => 
      model.inCooldown && model.minutesRemaining
    ).sort((a, b) => (a.minutesRemaining || 0) - (b.minutesRemaining || 0)) || [];

    if (availableModels.length <= 2 && modelsInCooldown.length > 0) {
      const nextAvailable = modelsInCooldown[0];
      addNotification(
        'info',
        'Model Status',
        `${nextAvailable.displayName} will be available in ${formatCooldownTime(nextAvailable.minutesRemaining || 0)}.`,
        5000
      );
    }

    try {
      await sendMessage();
      // Refresh usage data after sending
      setTimeout(() => refetch(), 1000);
    } catch (error) {
      console.error('Send message error:', error);
      addNotification(
        'error',
        'Send Error',
        'Failed to send message. Please try again.',
        5000
      );
    }
  };

  const handleFileAttachment = () => {
    addNotification(
      'info',
      'File Attachment',
      'File attachment feature is coming soon! We\'re working on supporting multiple file types including documents, images, and more.',
      6000
    );
  };

  const handleVoiceInput = () => {
    addNotification(
      'info',
      'Voice Input',
      'Voice input feature is coming soon! You\'ll be able to record and send voice messages directly from this interface.',
      6000
    );
  };

  // FIXED: Better availability calculation
  const availableModelsCount = usage?.availableModels?.filter(model => 
    !model.inCooldown && model.remaining > 0
  ).length || 0;
  
  const isRateLimited = availableModelsCount === 0;
  const isSendDisabled = isLoading || input.trim() === '' || isRateLimited;

  // Calculate next available time for better UX
  const nextModelAvailable = usage?.availableModels
    ?.filter(model => model.inCooldown && model.minutesRemaining)
    .sort((a, b) => (a.minutesRemaining || 0) - (b.minutesRemaining || 0))[0];

  return (
    <>
      {/* Enhanced Rate Limit Modal with better data */}
      <RateLimitModal 
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        resetTime={usage?.resetTime || new Date().toISOString()}
        nextAvailableAt={nextModelAvailable?.cooldownEndsAt}
        message={
          nextModelAvailable 
            ? `All models are in cooldown. ${nextModelAvailable.displayName} will be available in ${formatCooldownTime(nextModelAvailable.minutesRemaining || 0)}.`
            : "All model limits have been reached for today. Your limits will reset at midnight."
        }
        modelSummary={{
          availableModels: usage?.availableModels || [],
          allModelsExhausted: usage?.allModelsExhausted || true,
          nextAvailableAt: usage?.nextAvailableAt ? new Date(usage.nextAvailableAt) : undefined
        }}
      />

      <div className="w-full">
        <div className="max-w-4xl mx-auto">
          {/* Toggle Button for Model Status Bar */}
          {usage && (
            <div className="mb-2 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setIsModelStatusVisible(!isModelStatusVisible)}
                className="text-sm text-muted-foreground hover:bg-muted py-1 px-3 rounded-full transition-all duration-200"
              >
                {isModelStatusVisible ? (
                  <>
                    Hide Model Status <ChevronUp className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Show Model Status ({availableModelsCount} ready) <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Enhanced Model Status Bar */}
          {usage && isModelStatusVisible && (
            <div className="mb-2 p-3 bg-card rounded-lg border border-border/50 shadow-sm animate-fade-in-down">
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground font-medium">Active Model:</span>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getCostColor('high')}`}>
                    {getCostIcon('high')}
                    <span className="font-semibold">{usage.currentModel}</span>
                  </div>
                </div>
                <div className="text-muted-foreground text-right">
                  <div className="font-medium">{usage.totalRequestsToday} requests today</div>
                  <div className="text-xs">
                    {availableModelsCount} of {usage.availableModels?.length || 0} models ready
                  </div>
                </div>
              </div>
              
              {/* Enhanced Available Models with Better Status Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Model Status</span>
                  <span className="text-xs text-muted-foreground">
                    Next reset: {usage.resetTime ? new Date(usage.resetTime).toLocaleTimeString() : 'Unknown'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {usage.availableModels?.map((model, index) => {
                    const costType = getModelCost(model, index);
                    const isAvailable = !model.inCooldown && model.remaining > 0;
                    
                    return (
                      <div 
                        key={model.name}
                        className={`flex items-center justify-between p-2 rounded-2xl text-xs border transition-all ${
                          isAvailable
                            ? getCostColor(costType) + ' shadow-sm'
                            : 'text-gray-400 bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {getModelStatusIcon(model)}
                          <span className={isAvailable ? 'font-medium' : 'line-through'}>
                            {model.displayName}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          {model.inCooldown ? (
                            <div className="flex flex-col items-end">
                              <span className="text-orange-600 font-medium">
                                {formatCooldownTime(model.minutesRemaining || 0)}
                              </span>
                              <span className="text-xs text-gray-500">cooldown</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className={`font-medium ${model.remaining > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {model.remaining}
                              </span>
                              <span className="text-xs text-gray-500">remaining</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Next Available Time with Better Formatting */}
              {isRateLimited && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <div className="text-sm">
                      {nextModelAvailable ? (
                        <span className="text-orange-700">
                          <strong>{nextModelAvailable.displayName}</strong> available in{' '}
                          <strong>{formatCooldownTime(nextModelAvailable.minutesRemaining || 0)}</strong>
                        </span>
                      ) : (
                        <span className="text-orange-700">
                          All limits reached. Resets at <strong>midnight</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 relative flex items-end bg-background rounded-3xl shadow-sm border border-border/50 hover:border-border focus-within:border-border focus-within:ring-accent-orange transition-all duration-200">
            <div className="flex items-center space-x-2 pl-3">
              <Button
                variant="outline"
                onClick={handleFileAttachment}
                className="text-secondary-foreground rounded-full bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200 hover:scale-105"
                title="Attach file"
                disabled={isLoading}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
              placeholder={
                isRateLimited
                  ? nextModelAvailable
                    ? `All models in cooldown - next available in ${formatCooldownTime(nextModelAvailable.minutesRemaining || 0)}`
                    : "All models exhausted - resets at midnight"
                  : "Message Arnold..."
              }
              className={`flex-1 resize-none bg-transparent px-3 py-2 text-foreground placeholder-foreground/30 focus:outline-none overflow-hidden ${
                isRateLimited ? 'placeholder-red-400' : ''
              }`}
              disabled={isLoading || isRateLimited}
              style={{ minHeight: '24px' }}
            />
            
            <div className="flex items-center space-x-2 pr-3">
              <Button
                variant="outline"
                onClick={handleVoiceInput}
                className="text-secondary-foreground rounded-full bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200 hover:scale-105"
                title="Voice input"
                disabled={isLoading}
              >
                <Mic className="w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSendMessage}
                className={`transition-all duration-200 ${
                  isSendDisabled
                    ? 'text-text-muted cursor-not-allowed rounded-full opacity-50'
                    : 'text-secondary-foreground bg-primary hover:bg-primary/90 shadow-sm rounded-full hover:scale-105'
                }`}
                disabled={isSendDisabled}
                title={
                  isRateLimited
                    ? nextModelAvailable
                      ? `All models in cooldown - next available in ${formatCooldownTime(nextModelAvailable.minutesRemaining || 0)}`
                      : "All model limits reached"
                    : "Send message"
                }
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Enhanced footer */}
          <div className="flex justify-center items-center text-xs text-text-muted mt-2">
            <p>Arnold can make mistakes. Please use Arnold responsibly.</p>
          </div>
        </div>
      </div>
    </>
  );
}