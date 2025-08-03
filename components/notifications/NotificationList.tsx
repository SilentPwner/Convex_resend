// components/notifications/NotificationList.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import AlertBadge from './AlertBadge';
import { Button } from '../ui/button';
import { Icons } from '../ui/icons';

type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: 'success' | 'warning' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
};

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
  emptyState?: React.ReactNode;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onDismiss,
  className,
  emptyState,
}) => {
  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(id);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(id);
  };

  return (
    <div className={cn('w-full max-w-md space-y-2', className)}>
      {notifications.length === 0 ? (
        emptyState || (
          <div className="text-center py-8 text-gray-500">
            <Icons.Bell className="mx-auto h-8 w-8 mb-2" />
            <p>No notifications available</p>
          </div>
        )
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'p-4 rounded-lg border transition-all cursor-pointer hover:shadow-sm',
              notification.isRead
                ? 'bg-gray-50 border-gray-200'
                : 'bg-white border-gray-300 shadow-xs',
              {
                'hover:bg-emerald-50': notification.type === 'success',
                'hover:bg-amber-50': notification.type === 'warning',
                'hover:bg-red-50': notification.type === 'error',
                'hover:bg-blue-50': notification.type === 'info',
              }
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertBadge variant={notification.type} />
                  <h3 className="font-medium text-sm">{notification.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {notification.action && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        notification.action?.onClick();
                      }}
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                  >
                    <Icons.Check className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => handleDismiss(notification.id, e)}
                >
                  <Icons.X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationList;