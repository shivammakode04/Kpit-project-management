import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Flame, AlertCircle, Zap, Calendar, MessageSquare, Paperclip, GripVertical } from 'lucide-react';
import { cn, formatDate, isOverdue, isDueToday } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import type { Task } from '@/types';

interface KanbanCardProps {
  task: Task;
  isUpdating?: boolean;
}

const PRIORITY_CONFIG: Record<string, { icon: typeof Flame; color: string; bg: string; label: string }> = {
  high: { icon: Flame, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'High' },
  medium: { icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Medium' },
  low: { icon: AlertCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Low' },
};

export function KanbanCard({ task, isUpdating }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const overdue = isOverdue(task.due_date) && task.status !== 'done';
  const dueToday = isDueToday(task.due_date) && task.status !== 'done';
  const assignees = task.assigned_to_details || task.assigned_to_names?.map((name, i) => ({
    id: i, username: name, full_name: name, avatar_url: null,
  })) || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-grab active:cursor-grabbing',
        isDragging && 'z-50 opacity-80',
        isUpdating && 'opacity-50 pointer-events-none',
      )}
    >
      <div className={cn(
        'bg-white dark:bg-surface-800 rounded-xl p-3.5 border border-surface-200/80 dark:border-surface-700/60',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'hover:border-brand-200/60 dark:hover:border-brand-600/30',
        isDragging && 'shadow-xl ring-2 ring-brand-400/30 rotate-2',
      )}>
        {/* Drag handle + Title */}
        <div className="flex items-start gap-2" {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4 text-surface-300 dark:text-surface-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2 text-surface-800 dark:text-surface-200">
              {task.title}
            </h4>
            <p className="text-[11px] text-surface-400 mt-0.5 truncate">{task.story_title}</p>
          </div>
        </div>

        {/* Priority + Due date */}
        <div className="flex items-center gap-2 mt-3">
          {priorityCfg && (
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', priorityCfg.bg, priorityCfg.color)}>
              <priorityCfg.icon className="w-3 h-3" />
              {priorityCfg.label}
            </span>
          )}
          {task.due_date && (
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full',
              overdue
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : dueToday
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
            )}>
              <Calendar className="w-3 h-3" />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {/* Footer: assignees + meta */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-surface-100 dark:border-surface-700/50">
          {/* Assignees */}
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 3).map((user) => (
              <div
                key={user.id}
                title={user.full_name || user.username}
                className="ring-2 ring-white dark:ring-surface-800 rounded-full"
              >
                <Avatar
                  name={user.full_name || user.username}
                  src={user.avatar_url || undefined}
                  size="xs"
                />
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-[9px] font-bold ring-2 ring-white dark:ring-surface-800">
                +{assignees.length - 3}
              </div>
            )}
            {assignees.length === 0 && (
              <span className="text-[10px] text-surface-400 italic">Unassigned</span>
            )}
          </div>

          {/* Comment + attachment counts */}
          <div className="flex items-center gap-2">
            {task.comment_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-surface-400">
                <MessageSquare className="w-3 h-3" />
                {task.comment_count}
              </span>
            )}
            {task.attachment_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-surface-400">
                <Paperclip className="w-3 h-3" />
                {task.attachment_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
