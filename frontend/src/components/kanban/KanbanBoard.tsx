import { useState } from 'react';
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Paperclip, Star, StarOff, AlertCircle } from 'lucide-react';
import type { Task } from '@/types';
import { cn, isOverdue, formatDate } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';

interface KanbanBoardProps {
  tasks: Task[];
  bookmarks: number[];
  onStatusChange: (taskId: number, status: string) => void;
  onTaskClick: (task: Task) => void;
  onBookmark: (taskId: number) => void;
  readonly?: boolean;
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-surface-400' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500' },
] as const;

export default function KanbanBoard({
  tasks, bookmarks, onStatusChange, onTaskClick, onBookmark, readonly = false,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || readonly) return;
    const column = COLUMNS.find((c) => c.id === over.id);
    if (column) {
      const task = tasks.find((t) => t.id === active.id);
      if (task && task.status !== column.id) {
        onStatusChange(task.id, column.id);
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          return (
            <KanbanColumn key={column.id} column={column} tasks={columnTasks} bookmarks={bookmarks}
              onBookmark={onBookmark} onTaskClick={onTaskClick} readonly={readonly} />
          );
        })}
      </div>
      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} isBookmarked={bookmarks.includes(activeTask.id)} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  column, tasks, bookmarks, onBookmark, onTaskClick, readonly,
}: {
  column: typeof COLUMNS[number];
  tasks: Task[];
  bookmarks: number[];
  onBookmark: (id: number) => void;
  onTaskClick: (task: Task) => void;
  readonly: boolean;
}) {
  const { setNodeRef } = useSortable({ id: column.id });

  return (
    <div ref={setNodeRef} className="flex flex-col rounded-2xl bg-surface-100/50 dark:bg-surface-800/30 p-3 min-h-[300px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn('w-2.5 h-2.5 rounded-full', column.color)} />
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="ml-auto text-xs text-surface-500 font-medium bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} isBookmarked={bookmarks.includes(task.id)}
              onBookmark={onBookmark} onClick={() => onTaskClick(task)} readonly={readonly} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({
  task, isBookmarked, onBookmark, onClick, readonly,
}: {
  task: Task; isBookmarked: boolean; onBookmark: (id: number) => void; onClick: () => void; readonly: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id, disabled: readonly,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isBookmarked={isBookmarked} onBookmark={onBookmark} onClick={onClick} />
    </div>
  );
}

function TaskCard({
  task, isBookmarked, onBookmark, onClick, isDragOverlay,
}: {
  task: Task; isBookmarked: boolean; onBookmark?: (id: number) => void;
  onClick?: () => void; isDragOverlay?: boolean;
}) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <motion.div
      layout={!isDragOverlay}
      className={cn(
        'glass-card p-3.5 cursor-pointer hover:shadow-md transition-shadow group',
        isDragOverlay && 'shadow-xl rotate-1 scale-105',
        overdue && 'ring-1 ring-danger/30',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium leading-snug flex-1">{task.title}</h4>
        {onBookmark && (
          <button
            onClick={(e) => { e.stopPropagation(); onBookmark(task.id); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            {isBookmarked
              ? <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              : <StarOff className="w-3.5 h-3.5 text-surface-400" />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
          task.priority === 'high' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          task.priority === 'medium' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          task.priority === 'low' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        )}>
          {task.priority}
        </span>

        {task.due_date && (
          <span className={cn('flex items-center gap-1 text-[10px]',
            overdue ? 'text-danger font-medium' : 'text-surface-500')}>
            {overdue && <AlertCircle className="w-3 h-3" />}
            <Calendar className="w-3 h-3" />
            {formatDate(task.due_date)}
          </span>
        )}

        {task.comment_count > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-surface-500">
            <MessageSquare className="w-3 h-3" />{task.comment_count}
          </span>
        )}
        {task.attachment_count > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-surface-500">
            <Paperclip className="w-3 h-3" />{task.attachment_count}
          </span>
        )}
      </div>

      {task.assigned_to_name && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-surface-100 dark:border-surface-800">
          <Avatar name={task.assigned_to_name} size="sm" />
          <span className="text-xs text-surface-500 truncate">{task.assigned_to_name}</span>
        </div>
      )}
    </motion.div>
  );
}
