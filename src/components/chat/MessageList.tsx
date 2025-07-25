// src/components/chat/MessageList.tsx
import React from 'react';
import MessageBubble from './MessageBubble';
import LoadingSpinner from '../ui/loading-spinner';
import { useChatScroll } from '@/hooks/useChatScroll';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Sparkles, MessageCircle } from 'lucide-react';

interface MessageListProps {
  messages: { role: string; content: string }[];
  isLoading: boolean;
}

const MessageList = React.memo(function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useChatScroll({ dependency: messages });

  const EmptyState = React.useCallback(() => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center justify-center h-full text-center px-6 py-12"
    >
      {/* Arnold Logo/Avatar */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-lg">
          <Bot className="w-10 h-10 text-primary-foreground" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center"
        >
          <Sparkles className="w-3 h-3 text-accent-foreground" />
        </motion.div>
      </motion.div>

      {/* Welcome Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-4 max-w-md"
      >
        <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
          Hey there! I'm Arnold 👋
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Your AI scheduling assistant powered by advanced intelligence. I can help you manage appointments, 
          schedule meetings, and organize your calendar seamlessly.
        </p>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-2xl"
      >
        {[
          { icon: MessageCircle, text: "Natural conversation" },
          { icon: Bot, text: "Smart scheduling" },
          { icon: Sparkles, text: "Google Calendar sync" },
        ].map((feature, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-all duration-200"
          >
            <feature.icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{feature.text}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Suggestion Pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex flex-wrap gap-2 mt-6"
      >
        {["Schedule a meeting", "Book an appointment", "Plan my day"].map((suggestion, index) => (
          <div
            key={index}
            className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          >
            {suggestion}
          </div>
        ))}
      </motion.div>
    </motion.div>
  ), []);

  const LoadingIndicator = React.useCallback(() => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-6"
    >
      <div className="flex items-start max-w-[85%]">
        {/* Arnold Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 bg-accent text-accent-foreground border border-border rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
        </div>

        {/* Typing Indicator */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-1">Arnold</div>
          <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <div className="flex items-center space-x-3">
              <LoadingSpinner className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Arnold is thinking...</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  ), []);

  return (
    <main className="flex-1 overflow-hidden relative bg-background">
      {/* Background Pattern - Subtle */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      </div>

      {messages.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full">
          <EmptyState />
        </div>
      ) : (
        <div className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <MessageBubble 
                  key={`${m.role}-${i}`} 
                  role={m.role as 'user' | 'assistant'} 
                  content={m.content} 
                />
              ))}
              
              {isLoading && <LoadingIndicator />}
            </AnimatePresence>

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </main>
  );
});

export default MessageList;