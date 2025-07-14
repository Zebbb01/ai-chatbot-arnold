// src/components/chat/ChatInput.tsx
import React from 'react';
import Button from '../ui/Button';
import { useAutosizeTextarea } from '@/hooks/useAutosizeTextarea';
import { Send, Paperclip, Mic } from 'lucide-react';

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
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="p-1 relative flex items-end bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all duration-200">
          <div className="flex items-center space-x-2 pl-3">
            <Button
              onClick={() => alert("File attachment coming soon!")}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
            className="flex-1 resize-none bg-transparent px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none overflow-hidden"
            disabled={isLoading}
            style={{ minHeight: '24px' }}
          />

          <div className="flex items-center space-x-2 pr-3">
            <Button
              onClick={() => alert("Voice input coming soon!")}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Voice input"
              disabled={isLoading}
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSendMessage}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isLoading || input.trim() === ''
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-white bg-blue-500 hover:bg-blue-600 shadow-sm'
              }`}
              disabled={isLoading || input.trim() === ''}
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
          Arnold can make mistakes. Please use Arnold responsibly.
        </p>
      </div>
    </div>
  );
}