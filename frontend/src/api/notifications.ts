import api from './client';
import type { Notification, PaginatedResponse } from '@/types';

export const notificationsApi = {
  list: (page = 1) =>
    api.get<PaginatedResponse<Notification>>('/notifications/', { params: { page } }),

  markRead: (id: number) =>
    api.patch<Notification>(`/notifications/${id}/read/`),

  markAllRead: () =>
    api.post('/notifications/mark-all-read/'),

  getUnreadCount: () =>
    api.get<{ unread_count: number }>('/notifications/unread-count/'),
};
