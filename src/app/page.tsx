// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatContainer from '@/components/chat/ChatContainer';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function HomePage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
          conversationId: null, // New conversation
          userMessage: userMessage,
          userId: session.user.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const data = await res.json();

      // IMPORTANT: Redirect before updating state if possible to avoid rendering this page again
      if (data.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      } else {
        // If for some reason a conversationId isn't returned, update the state here
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-foreground border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground">Loading...</p>
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
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md space-y-4">
              <div className="w-36 h-36 relative rounded-full overflow-hidden mx-auto bg-muted"> 
                <Image
                  src="/img/logo.png"
                  alt="Arnold Logo Preview"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-full"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}! 👋
                </h2>
                <p className="text-muted-foreground">
                  I'm Arnold, your AI scheduling assistant. I can help you create calendar events,
                  manage appointments, and answer any questions you might have.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="bg-secondary border border-border rounded-2xl p-3 text-left">
                  <p className="font-medium text-primary">📅 Schedule Events</p>
                  <p className="text-foreground">Try: "Schedule a team meeting tomorrow at 2 PM and invite john@company.com and sarah@company.com"</p>
                </div>
                <div className="bg-secondary border border-border rounded-2xl p-3 text-left">
                  <p className="font-medium text-primary">🗓️ Calendar Integration</p>
                  <p className="text-foreground">Events automatically sync with your Google Calendar</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
        
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