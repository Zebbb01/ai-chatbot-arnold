// src/hooks/useNotifications.ts
import { useState, useCallback } from 'react';
import { Notification, NotificationType } from '@/types/notification';

// Define the context value type for better type safety
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, title: string, message: string, duration?: number) => void;
  dismissNotification: (id: string) => void;
}

export const useNotifications = (): NotificationContextType => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (type: NotificationType, title: string, message: string, duration: number = 5000) => {
      const id = Math.random().toString(36).substr(2, 9); // Simple unique ID
      const notification: Notification = { id, type, title, message, duration };

      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
      }
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
  };
};

// You might also want to export a context to use this hook globally
// We'll do this in the provider step.