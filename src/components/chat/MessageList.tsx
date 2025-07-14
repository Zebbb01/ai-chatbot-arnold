// src/components/chat/MessageList.tsx
import React from 'react';
import MessageBubble from './MessageBubble';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useChatScroll } from '@/hooks/useChatScroll';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: { role: string; content: string }[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useChatScroll({ dependency: messages });

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
        Hello! I'm Arnold
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">
        I'm an AI assistant created by Anthropic. I can help you with analysis, writing, coding, math, and many other tasks. What would you like to explore today?
      </p>
    </div>
  );

  return (
    <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
      {messages.length === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role as 'user' | 'assistant'} content={m.content} />
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start mb-6"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Arnold is thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </main>
  );
}