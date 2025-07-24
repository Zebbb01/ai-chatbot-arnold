// src/components/chat/ChatInput.tsx
import React from 'react';
import { useAutosizeTextarea } from '@/hooks/useAutosizeTextarea';
import { Send, Paperclip, Mic } from 'lucide-react';
import { Button } from '../ui/button';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
}

export default function ChatInput({ input, setInput, sendMessage, isLoading }: ChatInputProps) {
  const textareaRef = useAutosizeTextarea({ value: input, maxHeight: 200 });

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

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto">
        <div className="p-3 relative flex items-end bg-background rounded-3xl shadow-sm border border-border focus-within:border-background focus-within:ring-1 focus-within:ring-accent-orange transition-all duration-200">
          <div className="flex items-center space-x-2 pl-3">
            <Button
              variant={'outline'}
              onClick={() => alert("File attachment coming soon!")}
              className="text-secondary-foreground rounded-full bg-primary hover:bg-primary/90 shadow-sm"
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
            variant={'outline'}
              onClick={() => alert("Voice input coming soon!")}
              className="text-secondary-foreground rounded-full bg-primary hover:bg-primary/90 shadow-sm"
              title="Voice input"
              disabled={isLoading}
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Button
            variant={'outline'}
              onClick={handleSendMessage}
              className={`${isLoading || input.trim() === ''
                ? 'text-text-muted cursor-not-allowed rounded-full'
                : 'text-secondary-foreground bg-primary hover:bg-primary/90 shadow-sm rounded-full'
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
  );
}
