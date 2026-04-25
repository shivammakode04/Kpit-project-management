import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count?: number;
  children: React.ReactNode;
}

const COLUMN_STYLES: Record<string, { gradient: string; dot: string; badge: string; class: string }> = {
  todo: {
    gradient: 'kanban-column-todo',
    dot: 'bg-slate-400',
    badge: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    class: 'kanban-column',
  },
  in_progress: {
    gradient: 'kanban-column-in-progress',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    class: 'kanban-column',
  },
  done: {
    gradient: 'kanban-column-done',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    class: 'kanban-column',
  },
};

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const style = COLUMN_STYLES[id] || COLUMN_STYLES.todo;

  return (
    <div className={cn(style.class, style.gradient, isOver && 'ring-2 ring-brand-400/40 ring-offset-2')}>
      {/* Column Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className={cn('w-2.5 h-2.5 rounded-full', style.dot)} />
        <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
        {count !== undefined && (
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full ml-auto', style.badge)}>
            {count}
          </span>
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'space-y-3 min-h-[400px] rounded-xl p-2 transition-colors duration-200',
          isOver && 'bg-brand-50/50 dark:bg-brand-900/10',
        )}
      >
        {children}
      </div>
    </div>
  );
}
