import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';

const POLL_INTERVAL = 10_000; // Reduced to 10 seconds for better responsiveness

export function useNotifications() {
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);
}
