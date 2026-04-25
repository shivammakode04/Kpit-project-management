import { cn } from '@/lib/utils';
import type { Priority } from '@/types';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const config: Record<Priority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const { label, className: colorClass } = config[priority] ?? config.medium;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
