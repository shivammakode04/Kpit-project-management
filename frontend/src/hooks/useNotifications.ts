import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';

const POLL_INTERVAL = 30_000;

export function useNotifications() {
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);
}
