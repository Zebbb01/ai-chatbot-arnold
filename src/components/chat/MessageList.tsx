// src/components/chat/MessageList.tsx
import React from 'react';
import MessageBubble from './MessageBubble';
import LoadingSpinner from '../ui/loading-spinner';
import { useChatScroll } from '@/hooks/useChatScroll';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: { role: string; content: string }[];
  isLoading: boolean;
}

const MessageList = React.memo(function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useChatScroll({ dependency: messages });

  const EmptyState = React.useCallback(() => (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Hello! I'm Arnold
      </h2>
      <p className="text-muted-foreground max-w-md">
        I'm an AI assistant created by Anthropic. I can help you with analysis, writing, coding, math, and many other tasks. What would you like to explore today?
      </p>
    </div>
  ), []);

  const LoadingIndicator = React.useCallback(() => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-6"
    >
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 border border-border">
          <div className="flex items-center space-x-2">
            <LoadingSpinner className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Arnold is thinking...</span>
          </div>
        </div>
      </div>
    </motion.div>
  ), []);

  return (
    <main className={`flex-1 bg-background ${messages.length > 0 || isLoading ? 'overflow-y-auto' : 'flex items-center justify-center'}`}>
      {messages.length === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role as 'user' | 'assistant'} content={m.content} />
            ))}
            
            {isLoading && <LoadingIndicator />}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </main>
  );
});

export default MessageList;