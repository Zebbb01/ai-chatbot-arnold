// src/components/chat/ChatInput.tsx
import React from 'react';
import { useAutosizeTextarea } from '@/hooks/useAutosizeTextarea';
import { Send, Paperclip, Mic } from 'lucide-react'; // No need for X, FileText, MicIcon here
import { Button } from '../ui/button';
import { useNotification } from '@/providers/NotificationProvider'; // Import the new hook

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
}

export default function ChatInput({ input, setInput, sendMessage, isLoading }: ChatInputProps) {
  const textareaRef = useAutosizeTextarea({ value: input, maxHeight: 200 });
  const { addNotification } = useNotification(); // Use the context hook

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && input.trim() !== '') {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSendMessage = () => {
    if (input.trim() !== '' && !isLoading) {
      sendMessage();
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

  return (
    <>
      {/* The NotificationContainer is now rendered by NotificationProvider, no need here */}
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
              placeholder="Message Arnold..."
              className="flex-1 resize-none bg-transparent px-3 py-2 text-foreground placeholder-foreground/30 focus:outline-none overflow-hidden"
              disabled={isLoading}
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
                  isLoading || input.trim() === ''
                    ? 'text-text-muted cursor-not-allowed rounded-full opacity-50'
                    : 'text-secondary-foreground bg-primary hover:bg-primary/90 shadow-sm rounded-full hover:scale-105'
                }`}
                disabled={isLoading || input.trim() === ''}
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <p className="text-center text-xs text-text-muted my-2">
            Arnold can make mistakes. Please use Arnold responsibly.
          </p>
        </div>
      </div>
    </>
  );
}