import api from './client';
import type { User, AuthTokens } from '@/types';

export const authApi = {
  register: (data: { username: string; email: string; password: string; password_confirm: string; full_name?: string }) =>
    api.post<User>('/auth/register/', data),

  login: (data: { username: string; password: string }) =>
    api.post<AuthTokens>('/auth/login/', data),

  refresh: (refresh: string) =>
    api.post<{ access: string }>('/auth/refresh/', { refresh }),

  getProfile: () =>
    api.get<User>('/auth/profile/'),

  updateProfile: (data: Partial<Pick<User, 'email' | 'full_name'>>) =>
    api.patch<User>('/auth/profile/', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<User>('/auth/profile/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  changePassword: (data: { old_password: string; new_password: string; new_password_confirm: string }) =>
    api.post('/auth/profile/password/', data),

  listUsers: () =>
    api.get<User[]>('/auth/users/'),
};
