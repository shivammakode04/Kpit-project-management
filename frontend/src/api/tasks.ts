import api from './client';
import type { Task, Comment, TaskAttachment, PaginatedResponse } from '@/types';

export const tasksApi = {
  list: (storyId: number, params?: Record<string, string>) =>
    api.get<PaginatedResponse<Task>>(`/stories/${storyId}/tasks/`, { params }),

  listByProject: (projectId: number, params?: Record<string, string>) =>
    api.get<PaginatedResponse<Task>>(`/projects/${projectId}/tasks/`, { params }),

  getMyTasks: () =>
    api.get<PaginatedResponse<Task>>('/tasks/my/'),

  get: (id: number) =>
    api.get<Task>(`/tasks/${id}/`),

  create: (storyId: number, data: {
    title: string;
    description?: string;
    priority?: string;
    assigned_to?: number[];
    due_date?: string | null;
  }) =>
    api.post<Task>(`/stories/${storyId}/tasks/`, data),

  update: (id: number, data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assigned_to' | 'due_date'>>) =>
    api.patch<Task>(`/tasks/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/tasks/${id}/`),

  updateStatus: (id: number, status: string) =>
    api.patch<Task>(`/tasks/${id}/status/`, { status }),

  assign: (id: number, assignedTo: number | null) =>
    api.post<Task>(`/tasks/${id}/assign/`, { assigned_to: assignedTo }),

  getComments: (taskId: number) =>
    api.get<PaginatedResponse<Comment>>(`/tasks/${taskId}/comments/`),

  addComment: (taskId: number, content: string) =>
    api.post<Comment>(`/tasks/${taskId}/comments/`, { content }),

  deleteComment: (commentId: number) =>
    api.delete(`/comments/${commentId}/`),

  getAttachments: (taskId: number) =>
    api.get<TaskAttachment[]>(`/tasks/${taskId}/attachments/`),

  uploadAttachment: (taskId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<TaskAttachment>(`/tasks/${taskId}/attachments/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
