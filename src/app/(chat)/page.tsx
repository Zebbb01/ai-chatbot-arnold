// src/app/(chat)/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ChatContainer from '@/components/chat/ChatContainer';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';

export default function HomePage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = async () => {
    if (input.trim() === '') {
      return;
    }

    const userMessage = input;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId: conversationId, userMessage: userMessage }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Oops! Something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContainer>
      <ChatHeader />
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        isLoading={isLoading}
      />
    </ChatContainer>
  );
}