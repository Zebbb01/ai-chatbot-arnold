// src/components/chat/ChatInput.tsx - UPDATED WITH RATE LIMITING
import React, { useState } from 'react';
import { useAutosizeTextarea } from '@/hooks/useAutosizeTextarea';
import { Send, Paperclip, Mic } from 'lucide-react';
import { Button } from '../ui/button';
import { useNotification } from '@/providers/NotificationProvider';
import { useRateLimit } from '@/hooks/useRateLimit'; // NEW IMPORT
import RateLimitModal from '@/components/ui/RateLimitModal'; // NEW IMPORT

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
}

export default function ChatInput({ input, setInput, sendMessage, isLoading }: ChatInputProps) {
  const textareaRef = useAutosizeTextarea({ value: input, maxHeight: 200 });
  const { addNotification } = useNotification();
  
  // NEW: Rate limiting state
  const { usage, refetch } = useRateLimit();
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && input.trim() !== '') {
      e.preventDefault();
      handleSendMessage(); // Use our new function
    }
  };

  // UPDATED: Enhanced send message function with rate limit checking
  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;
    
    // Check if user has exceeded their limit using null-safe comparison
    if (usage && (usage.requests_remaining ?? 0) <= 0) {
      setShowRateLimitModal(true);
      return;
    }

    // Show warning if user is close to limit
    const remaining = usage?.requests_remaining ?? Infinity;
    if (usage && remaining <= 3 && remaining > 0) {
      addNotification(
        'warning',
        'Usage Warning',
        `You have ${remaining} requests remaining today. Your limit resets at midnight.`,
        5000
      );
    }

    // Call the original sendMessage function
    try {
      await sendMessage();
      // Refresh usage stats after successful request
      setTimeout(() => refetch(), 1000);
    } catch (error) {
      console.error('Send message error:', error);
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

  // Check if send button should be disabled - fix null handling
  const isRateLimited = usage ? (usage.requests_remaining ?? 0) <= 0 : false;
  const isSendDisabled = isLoading || input.trim() === '' || isRateLimited;

  return (
    <>
      {/* Rate Limit Modal - ADD THIS */}
      <RateLimitModal 
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        resetTime={usage?.reset_time || new Date().toISOString()}
        message={`You've reached your daily limit of ${usage?.daily_limit || 50} requests. Your limit will reset at midnight.`}
      />

      <div className="w-full">
        <div className="max-w-4xl mx-auto">
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
                  ? "Daily limit reached - resets at midnight" 
                  : "Message Arnold..."
              }
              className="flex-1 resize-none bg-transparent px-3 py-2 text-foreground placeholder-foreground/30 focus:outline-none overflow-hidden"
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
                    ? "Daily limit reached" 
                    : "Send message"
                }
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Enhanced footer with usage info */}
          <div className="flex justify-between items-center text-xs text-text-muted my-2">
            <p>Arnold can make mistakes. Please use Arnold responsibly.</p>
            
            {/* Usage indicator in footer */}
            {usage && (
              <div className="flex items-center space-x-2">
                <span className={`${
                  (usage.requests_remaining ?? 0) <= 5 ? 'text-orange-500' : 
                  (usage.requests_remaining ?? 0) <= 1 ? 'text-red-500' : 
                  'text-green-500'
                }`}>
                  {usage.requests_remaining ?? 0}/{usage.daily_limit} daily requests left 
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}