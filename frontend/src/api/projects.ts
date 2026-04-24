import api from './client';
import type { Project, ProjectMember, PaginatedResponse, ActivityLog } from '@/types';

export const projectsApi = {
  list: (page = 1) =>
    api.get<PaginatedResponse<Project>>('/projects/', { params: { page } }),

  get: (id: number) =>
    api.get<Project>(`/projects/${id}/`),

  create: (data: { name: string; description?: string }) =>
    api.post<Project>('/projects/', data),

  update: (id: number, data: Partial<Pick<Project, 'name' | 'description'>>) =>
    api.patch<Project>(`/projects/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/projects/${id}/`),

  archive: (id: number) =>
    api.post<Project>(`/projects/${id}/archive/`),

  getMembers: (id: number) =>
    api.get<ProjectMember[]>(`/projects/${id}/members/`),

  addMember: (projectId: number, data: { user_id: number; role: string }) =>
    api.post<ProjectMember>(`/projects/${projectId}/members/`, data),

  removeMember: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}/`),

  changeMemberRole: (projectId: number, userId: number, role: string) =>
    api.patch<ProjectMember>(`/projects/${projectId}/members/${userId}/role/`, { role }),

  getActivity: (id: number, page = 1) =>
    api.get<PaginatedResponse<ActivityLog>>(`/projects/${id}/activity/`, { params: { page } }),

  exportCsv: (id: number) =>
    api.get(`/projects/${id}/export/`, {
      params: { format: 'csv' },
      responseType: 'blob',
    }),

  exportPdf: (id: number) =>
    api.get(`/projects/${id}/export/`, {
      params: { format: 'pdf' },
      responseType: 'blob',
    }),
};
