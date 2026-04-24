import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: localStorage.getItem('flowforge_theme') === 'dark' ||
    (!localStorage.getItem('flowforge_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),

  toggle: () =>
    set((state) => {
      const newDark = !state.isDark;
      localStorage.setItem('flowforge_theme', newDark ? 'dark' : 'light');
      return { isDark: newDark };
    }),
}));
