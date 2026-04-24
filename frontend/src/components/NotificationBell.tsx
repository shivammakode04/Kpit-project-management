import { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { notificationsApi } from '@/api/notifications';
import { projectsApi } from '@/api/projects';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data);
      const unread = res.data.filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  const handleAcceptInvite = async (notification: Notification) => {
    if (!notification.related_object_id) return;
    
    try {
      setLoading(true);
      await projectsApi.acceptInvite(notification.related_object_id);
      await notificationsApi.markAsRead(notification.id);
      
      toast({
        title: 'Success',
        description: 'Invitation accepted! You can now access the project.',
      });
      
      loadNotifications();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await notificationsApi.markAsRead(notification.id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleDismiss = async (notification: Notification) => {
    try {
      await notificationsApi.markAsRead(notification.id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to dismiss notification', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            </div>

            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                        !notification.is_read && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                          {notification.type === 'project_invite' && (
                            <Badge className="mt-2 text-xs">Project Invite</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {notification.type === 'project_invite' && !notification.is_read && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAcceptInvite(notification)}
                              disabled={loading}
                              className="h-8 px-2 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Accept
                            </Button>
                          )}
                          <button
                            onClick={() => handleDismiss(notification)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  notificationsApi.markAllAsRead();
                  loadNotifications();
                }}
              >
                Mark all as read
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
