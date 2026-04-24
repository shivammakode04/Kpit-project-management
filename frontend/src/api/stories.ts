import api from './client';
import type { UserStory, PaginatedResponse } from '@/types';

export const storiesApi = {
  list: (projectId: number, page = 1) =>
    api.get<PaginatedResponse<UserStory>>(`/projects/${projectId}/stories/`, { params: { page } }),

  get: (id: number) =>
    api.get<UserStory>(`/stories/${id}/`),

  create: (projectId: number, data: { title: string; description?: string; priority?: string }) =>
    api.post<UserStory>(`/projects/${projectId}/stories/`, data),

  update: (id: number, data: Partial<Pick<UserStory, 'title' | 'description' | 'status' | 'priority'>>) =>
    api.patch<UserStory>(`/stories/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/stories/${id}/`),
};
