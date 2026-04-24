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

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  fetchNotifications: async () => {
    try {
      const { data } = await notificationsApi.list();
      set({ notifications: data.results });
    } catch {
      /* silently fail */
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await notificationsApi.getUnreadCount();
      set({ unreadCount: data.unread_count });
    } catch {
      /* silently fail */
    }
  },

  markRead: async (id) => {
    await notificationsApi.markRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await notificationsApi.markAllRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  closePanel: () => set({ isOpen: false }),
}));
