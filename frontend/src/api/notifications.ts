import api from './client';
import type { Notification, PaginatedResponse } from '@/types';

export const notificationsApi = {
  list: () =>
    api.get<PaginatedResponse<Notification>>('/notifications/'),

  get: (id: number) =>
    api.get<Notification>(`/notifications/${id}/`),

  markAsRead: (id: number) =>
    api.patch<Notification>(`/notifications/${id}/`, { is_read: true }),

  markAllAsRead: () =>
    api.post('/notifications/mark-all-read/'),

  getUnreadCount: () =>
    api.get<{ unread_count: number }>('/notifications/unread-count/'),

  delete: (id: number) =>
    api.delete(`/notifications/${id}/`),
};
