// src/app/(main)/chat/[conversationId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ChatContainer from '@/components/chat/ChatContainer';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';

// Define the shape of a message
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Consider memoizing this function if it's called very frequently with the same conversationId
// For a single page, it's less critical, but good practice if reused.
// However, since it's an async function and its result is used directly,
// useMemo wouldn't cache the *function*, but its *return value*, which isn't what we want here.
// Keep it as a regular function outside the component.
async function getChatHistory(conversationId: string): Promise<Message[]> {
  try {
    const response = await fetch(`/api/chat/history?conversationId=${conversationId}`);
    if (!response.ok) {
      console.error("Failed to fetch chat history");
      return [];
    }
    return response.json();
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    return [];
  }
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const params = useParams();
  const conversationId = params.conversationId as string;
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (conversationId && status === 'authenticated') {
      setIsLoading(true);
      getChatHistory(conversationId)
        .then(history => {
          setMessages(history);
        })
        .catch(error => {
          console.error("Error loading chat history:", error);
          setMessages([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === 'authenticated') {
      setIsLoading(false);
      setMessages([]);
    }
  }, [conversationId, status]);

  const sendMessage = useCallback(async () => {
    if (input.trim() === '' || !session?.user?.id) return;

    const userMessageContent = input;
    setMessages((prev) => [...prev, { role: 'user', content: userMessageContent }]);
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const data = await res.json();

      if (data.conversationId && data.conversationId !== conversationId) {
        router.push(`/chat/${data.conversationId}`);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Oops! Something went wrong. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, conversationId, session?.user?.id, setMessages, setInput, setIsLoading, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          {/* Spinner colors using theme variables */}
          <div className="w-12 h-12 border-4 border-primary-foreground border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground">Loading Chat...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <ChatContainer>
      <div className="flex flex-col flex-1 min-h-0">
        <MessageList messages={messages} isLoading={isLoading && messages.length === 0} />
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </ChatContainer>
  );
}