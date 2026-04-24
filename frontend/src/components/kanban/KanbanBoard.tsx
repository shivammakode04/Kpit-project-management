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
import { Search, Filter, MoreVertical } from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { storiesApi } from '@/api/stories';
import type { Task, UserStory } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

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
    if (!task) return;

    setUpdating(taskId);

    try {
      await tasksApi.updateStatus(taskId, newStatus as any);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus as any } : t
        )
      );
    } catch (error) {
      console.error('Failed to update task status', error);
      loadData();
    } finally {
      setUpdating(null);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((t) => t.status === status);
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

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading kanban board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
              />
            </div>
          </div>
          
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={getFilteredTasks().filter(t => t.status === column.id).length}
            >
              <SortableContext
                items={getFilteredTasks().filter(t => t.status === column.id).map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {getFilteredTasks().filter(t => t.status === column.id).map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      isUpdating={updating === task.id}
                    />
                  ))}
                </div>
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
