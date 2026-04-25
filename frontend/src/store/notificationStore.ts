import { create } from 'zustand';
import type { Notification } from '@/types';
import { notificationsApi } from '@/api/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  togglePanel: () => void;
  closePanel: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  // Listen for custom refresh events
  if (typeof window !== 'undefined') {
    window.addEventListener('refreshNotifications', () => {
      get().fetchNotifications();
      get().fetchUnreadCount();
    });
  }

  return {
    notifications: [],
    unreadCount: 0,
    isOpen: false,

    fetchNotifications: async () => {
      try {
        const { data } = await notificationsApi.list();
        set({ notifications: data.results ?? data });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    },

    fetchUnreadCount: async () => {
      try {
        const { data } = await notificationsApi.getUnreadCount();
        set({ unreadCount: data.unread_count });
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    },

    markRead: async (id) => {
      try {
        await notificationsApi.markAsRead(id);
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },

    markAllRead: async () => {
      try {
        await notificationsApi.markAllAsRead();
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        }));
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
      }
    },

    togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
    closePanel: () => set({ isOpen: false }),
  };
});
