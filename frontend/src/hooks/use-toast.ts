import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const toasts: Toast[] = [];
const listeners: ((toasts: Toast[]) => void)[] = [];

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast = { ...toast, id };
  toasts.push(newToast);
  listeners.forEach(listener => listener([...toasts]));
  
  setTimeout(() => {
    removeToast(id);
  }, 3000);
  
  return id;
};

const removeToast = (id: string) => {
  const index = toasts.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach(listener => listener([...toasts]));
  }
};

export const useToast = () => {
  const [, setToasts] = useState<Toast[]>([]);

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  subscribe(setToasts);

  return {
    toast: (props: Omit<Toast, 'id'>) => addToast(props),
    toasts,
    dismiss: removeToast,
  };
};
