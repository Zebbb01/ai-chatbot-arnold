// src/providers/NotificationProvider.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType, Notification } from '@/types/notification';
import { NotificationContainer } from '@/components/ui/notification/NotificationContainer';

// Define the context type
interface NotificationContextType {
  addNotification: (type: NotificationType, title: string, message: string, duration?: number) => void;
  dismissNotification: (id: string) => void; // Optional: if you want to allow direct dismissal from anywhere
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { notifications, addNotification, dismissNotification } = useNotifications();

  return (
    <NotificationContext.Provider value={{ addNotification, dismissNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};