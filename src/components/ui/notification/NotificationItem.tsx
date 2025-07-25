// src/components/ui/notification/NotificationItem.tsx
import React from 'react';
import { X, FileText, Mic as MicIcon, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Notification } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  const { id, type, title, message } = notification;

  const getIcon = () => {
    // You can customize icons based on type or title
    if (title.includes('File')) return <FileText className="w-5 h-5 text-blue-500" />; // Example custom color
    if (title.includes('Voice')) return <MicIcon className="w-5 h-5 text-purple-500" />; // Example custom color

    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Add styles based on notification type if you want visual differentiation
  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'border-green-400';
      case 'warning':
        return 'border-yellow-400';
      case 'error':
        return 'border-red-400';
      case 'info':
      default:
        return 'border-blue-400';
    }
  };

  return (
    <div className={`bg-card border ${getTypeClasses()} rounded-lg p-4 shadow-lg mb-2 transform transition-all duration-300 ease-in-out`}>
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

export { NotificationItem };