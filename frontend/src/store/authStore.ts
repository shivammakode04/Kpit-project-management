import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; password_confirm: string; full_name?: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('flowforge_tokens'),
  isLoading: false,

  login: async (username, password) => {
    const { data } = await authApi.login({ username, password });
    localStorage.setItem('flowforge_tokens', JSON.stringify(data));
    const profile = await authApi.getProfile();
    set({ user: profile.data, isAuthenticated: true });
  },

  register: async (registerData) => {
    await authApi.register(registerData);
    const { data } = await authApi.login({
      username: registerData.username,
      password: registerData.password,
    });
    localStorage.setItem('flowforge_tokens', JSON.stringify(data));
    const profile = await authApi.getProfile();
    set({ user: profile.data, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('flowforge_tokens');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.getProfile();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('flowforge_tokens');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (user) => set({ user }),
}));
