// src/components/chat/ChatInput.tsx
import React, { useState } from 'react';
import { useAutosizeTextarea } from '@/hooks/useAutosizeTextarea';
import { Send, Paperclip, Mic, X, FileText, Mic as MicIcon } from 'lucide-react';
import { Button } from '../ui/button';

// Notification types
type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
}

// Notification Component
const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const { id, type, title, message } = notification;

  const getIcon = () => {
    if (title.includes('File')) return <FileText className="w-5 h-5 text-primary" />;
    if (title.includes('Voice')) return <MicIcon className="w-5 h-5 text-primary" />;
    return <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">i</div>;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-lg mb-2 transform transition-all duration-300 ease-in-out">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Notification Container
const NotificationContainer: React.FC<{
  notifications: Notification[];
  onDismiss: (id: string) => void;
}> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

// Custom hook for notifications
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    type: NotificationType,
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, type, title, message, duration };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, duration);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
  };
};

export default function ChatInput({ input, setInput, sendMessage, isLoading }: ChatInputProps) {
  const textareaRef = useAutosizeTextarea({ value: input, maxHeight: 200 });
  const { notifications, addNotification, dismissNotification } = useNotifications();

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

  const handleFileAttachment = () => {
    addNotification(
      'info',
      'File Attachment',
      'File attachment feature is coming soon! We\'re working on supporting multiple file types including documents, images, and more.',
      6000
    );
  };

  const handleVoiceInput = () => {
    addNotification(
      'info',
      'Voice Input',
      'Voice input feature is coming soon! You\'ll be able to record and send voice messages directly from this interface.',
      6000
    );
  };

  return (
    <>
      {/* Notification Container */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <div className="w-full">
        <div className="max-w-4xl mx-auto">
          <div className="p-3 relative flex items-end bg-background rounded-3xl shadow-sm border border-border/50 hover:border-border focus-within:border-border focus-within:ring-accent-orange transition-all duration-200">
            <div className="flex items-center space-x-2 pl-3">
              <Button
                variant="outline"
                onClick={handleFileAttachment}
                className="text-secondary-foreground rounded-full bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200 hover:scale-105"
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
                variant="outline"
                onClick={handleVoiceInput}
                className="text-secondary-foreground rounded-full bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200 hover:scale-105"
                title="Voice input"
                disabled={isLoading}
              >
                <Mic className="w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSendMessage}
                className={`transition-all duration-200 ${
                  isLoading || input.trim() === ''
                    ? 'text-text-muted cursor-not-allowed rounded-full opacity-50'
                    : 'text-secondary-foreground bg-primary hover:bg-primary/90 shadow-sm rounded-full hover:scale-105'
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
    </>
  );
}