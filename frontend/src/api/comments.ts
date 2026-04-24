import api from './client';
import type { Comment, PaginatedResponse } from '@/types';

export const commentsApi = {
  list: (taskId: number) =>
    api.get<PaginatedResponse<Comment>>(`/tasks/${taskId}/comments/`),

  create: (taskId: number, content: string) =>
    api.post<Comment>(`/tasks/${taskId}/comments/`, { content }),

  update: (commentId: number, content: string) =>
    api.patch<Comment>(`/comments/${commentId}/`, { content }),

  delete: (commentId: number) =>
    api.delete(`/comments/${commentId}/`),
};
