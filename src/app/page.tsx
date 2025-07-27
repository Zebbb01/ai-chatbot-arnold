// =============================================================================
// src/app/page.tsx - UPDATED WITH RATE LIMIT HANDLING
// =============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatContainer from '@/components/chat/ChatContainer';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import RateLimitModal from '@/components/ui/RateLimitModal'; // NEW IMPORT

export default function HomePage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false); // NEW STATE
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null); // NEW STATE
  const router = useRouter();
  const { data: session, status } = useSession();

  const sendMessage = async () => {
    if (input.trim() === '' || !session?.user?.id || isLoading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: null,
          userMessage: userMessage,
          userId: session.user.id,
        }),
      });

      // NEW: Handle rate limit response
      if (res.status === 429) {
        const errorData = await res.json();
        setRateLimitInfo({
          resetTime: errorData.resetTime,
          message: errorData.message
        });
        setShowRateLimitModal(true);
        
        // Remove the user message since it wasn't processed
        setMessages((prev) => prev.slice(0, -1));
        setInput(userMessage); // Restore the input
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const data = await res.json();

      if (data.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg"
          >
            <Bot className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <p className="text-foreground text-lg font-medium">Booting up Arnold... Please wait.</p>
        </motion.div>
      </div>
    );
  }

  // Enhanced Unauthenticated State
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500/10 via-background to-orange-500/10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center space-y-4 p-8 bg-card rounded-lg shadow-xl"
        >
          <Sparkles className="w-12 h-12 text-accent mx-auto animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground">Authentication Required</h2>
          <p className="text-muted-foreground">You need to be signed in to use Arnold. Redirecting...</p>
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin mx-auto mt-4"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* NEW: Rate Limit Modal */}
      <RateLimitModal 
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        resetTime={rateLimitInfo?.resetTime || new Date().toISOString()}
        message={rateLimitInfo?.message}
      />

      <ChatContainer>
        <div className="flex flex-col flex-1 min-h-0">
          <MessageList messages={messages} isLoading={isLoading} />
          <ChatInput
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            isLoading={isLoading}
          />
        </div>
      </ChatContainer>
    </>
  );
}