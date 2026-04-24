import { cn } from '@/lib/utils';
import type { Status } from '@/types';

interface StatusChipProps {
  status: Status;
  onClick?: () => void;
  className?: string;
}

const config: Record<Status, { label: string; className: string }> = {
  todo: {
    label: 'To Do',
    className: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  done: {
    label: 'Done',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
};

export default function StatusChip({ status, onClick, className }: StatusChipProps) {
  const { label, className: colorClass } = config[status] ?? config.todo;
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      {...(onClick ? { onClick, type: 'button' as const } : {})}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        colorClass,
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className,
      )}
    >
      {label}
    </Tag>
  );
}
