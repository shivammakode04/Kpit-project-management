import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { tasksApi } from '@/api/tasks';
import { storiesApi } from '@/api/stories';
import { cn, getErrorMessage } from '@/lib/utils';
import type { Task, UserStory } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface KanbanBoardProps {
  projectId: number;
}

interface TaskFilters {
  search: string;
  priority: string;
  assignee: string;
  status: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    priority: '',
    assignee: '',
    status: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storiesRes, tasksRes] = await Promise.all([
        storiesApi.list(projectId),
        tasksApi.listByProject(projectId),
      ]);
      setStories(storiesRes.data.results ?? storiesRes.data as unknown as UserStory[]);
      setTasks(tasksRes.data.results ?? tasksRes.data as unknown as Task[]);
    } catch (error) {
      console.error('Failed to load kanban data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const taskId = parseInt(active.id as string);
    const newStatus = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t))
    );
    setUpdating(taskId);

    try {
      await tasksApi.updateStatus(taskId, newStatus as any);
      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      // Rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
      toast.error(getErrorMessage(error));
      loadData();
    } finally {
      setUpdating(null);
    }
  };

  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      if (filters.assignee && !task.assigned_to_details?.some(user => user.id.toString() === filters.assignee)) {
        return false;
      }
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();
  const hasActiveFilters = filters.search || filters.priority || filters.status;

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-32 rounded-lg" />
              {Array.from({ length: 3 }).map((__, j) => (
                <Skeleton key={j} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters Bar */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'btn-ghost py-2 px-3 text-sm flex items-center gap-1.5',
              hasActiveFilters && 'text-brand-600 bg-brand-50 dark:bg-brand-900/20',
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {hasActiveFilters && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="text-sm border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-1.5 bg-white dark:bg-surface-800"
            >
              <option value="">All Priorities</option>
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={() => setFilters({ search: '', priority: '', assignee: '', status: '' })}
                className="text-xs text-red-500 flex items-center gap-1 hover:text-red-600"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((column) => {
            const colTasks = filteredTasks.filter(t => t.status === column.id);
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color=""
                count={colTasks.length}
              >
                <SortableContext
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {colTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-surface-400 text-sm">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        isUpdating={updating === task.id}
                      />
                    ))
                  )}
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>
      </DndContext>

      {/* Summary bar */}
      <div className="flex items-center justify-center gap-6 text-xs text-surface-400 py-2">
        <span>{filteredTasks.filter(t => t.status === 'todo').length} to do</span>
        <span className="w-1 h-1 bg-surface-300 rounded-full" />
        <span>{filteredTasks.filter(t => t.status === 'in_progress').length} in progress</span>
        <span className="w-1 h-1 bg-surface-300 rounded-full" />
        <span>{filteredTasks.filter(t => t.status === 'done').length} done</span>
        <span className="w-1 h-1 bg-surface-300 rounded-full" />
        <span className="font-medium">{filteredTasks.length} total</span>
      </div>
    </div>
  );
}
