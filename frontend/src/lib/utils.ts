import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isAfter, parseISO, isToday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function getAvatarColor(seed: string): string {
  const colors = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function timeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'MMM d');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy · h:mm a');
  } catch {
    return dateString;
  }
}

export function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false;
  try {
    const date = parseISO(dateString);
    return isAfter(new Date(), date) && !isToday(date);
  } catch {
    return false;
  }
}

export function isDueToday(dateString: string | null): boolean {
  if (!dateString) return false;
  try {
    return isToday(parseISO(dateString));
  } catch {
    return false;
  }
}

const BOOKMARK_KEY_PREFIX = 'ff_bookmarks_';

export function getBookmarks(userId?: number): number[] {
  try {
    const key = userId ? `${BOOKMARK_KEY_PREFIX}${userId}` : BOOKMARK_KEY_PREFIX;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(taskId: number, userId?: number): number[] {
  const key = userId ? `${BOOKMARK_KEY_PREFIX}${userId}` : BOOKMARK_KEY_PREFIX;
  const current = getBookmarks(userId);
  const updated = current.includes(taskId)
    ? current.filter((id) => id !== taskId)
    : [...current, taskId];
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { detail?: string; message?: string } } };
    const data = axiosError.response?.data;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (typeof data === 'string') return data;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
