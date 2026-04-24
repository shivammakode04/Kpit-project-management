import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const [displayToasts, setDisplayToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setDisplayToasts(toasts);
  }, [toasts]);

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md">
      {displayToasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg p-4 shadow-lg flex items-start justify-between gap-4 animate-in slide-in-from-right-full ${
            toast.variant === 'destructive'
              ? 'bg-red-600 text-white'
              : 'bg-gray-900 text-white'
          }`}
        >
          <div className="flex-1">
            {toast.title && <div className="font-semibold">{toast.title}</div>}
            {toast.description && (
              <div className="text-sm opacity-90">{toast.description}</div>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="flex-shrink-0 hover:opacity-75"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
