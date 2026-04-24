import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; enabled?: boolean } = {},
) {
  const { ctrlKey = false, metaKey = false, shiftKey = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isTyping && !ctrlKey && !metaKey) return;

      if (
        e.key === key &&
        e.ctrlKey === ctrlKey &&
        e.metaKey === metaKey &&
        e.shiftKey === shiftKey
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, ctrlKey, metaKey, shiftKey, enabled]);
}
