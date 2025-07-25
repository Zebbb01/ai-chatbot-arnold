// src/components/ui/notification/NotificationContainer.tsx
import React from 'react';
import { Notification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] w-96 max-w-sm pointer-events-none"> {/* Higher z-index, pointer-events-none by default */}
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto"> {/* Re-enable pointer events for individual items */}
          <NotificationItem
            notification={notification}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  );
};

export { NotificationContainer };