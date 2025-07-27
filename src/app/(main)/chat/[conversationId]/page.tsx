// =============================================================================
// src/app/(main)/chat/[conversationId]/page.tsx - UPDATED WITH RATE LIMIT HANDLING
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ChatContainer from '@/components/chat/ChatContainer';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { getChatHistory } from '@/lib/chat/chat-api';
import { Message } from '@/types/chat';
import RateLimitModal from '@/components/ui/RateLimitModal'; // NEW IMPORT

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false); // NEW STATE
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null); // NEW STATE

  const params = useParams();
  const conversationId = params.conversationId as string;
  const { data: session, status } = useSession();
  const router = useRouter();

  // Load chat history when conversation ID changes
  useEffect(() => {
    if (conversationId && status === 'authenticated') {
      setIsLoadingHistory(true);
      getChatHistory(conversationId)
        .then(setMessages)
        .catch(error => {
          console.error("Error loading chat history:", error);
          setMessages([]);
        })
        .finally(() => setIsLoadingHistory(false));
    } else if (status === 'authenticated') {
      setMessages([]);
    }
  }, [conversationId, status]);

  const sendMessage = useCallback(async () => {
    if (input.trim() === '' || !session?.user?.id || isLoading) return;

    const userMessageContent = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessageContent }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          userMessage: userMessageContent,
          userId: session.user.id
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
        setMessages(prev => prev.slice(0, -1));
        setInput(userMessageContent); // Restore the input
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const data = await res.json();

      if (data.conversationId && data.conversationId !== conversationId) {
        router.push(`/chat/${data.conversationId}`);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Oops! Something went wrong. Please try again.'
      }]);
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
      setInput(userMessageContent); // Restore the input
    } finally {
      setIsLoading(false);
    }
  }, [input, conversationId, session?.user?.id, router, isLoading]);

  // Handle unauthenticated state
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
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
          <MessageList 
            messages={messages} 
            isLoading={isLoading || isLoadingHistory} 
          />
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