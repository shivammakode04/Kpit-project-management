import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, SortAsc, CheckCircle2, Clock, AlertTriangle,
  LayoutList, LayoutGrid, Layers, ChevronDown, X, Zap, Calendar,
  MessageSquare, Paperclip, ArrowUpRight,
} from 'lucide-react';
import { authApi } from '@/api/auth';
import { tasksApi } from '@/api/tasks';
import { useAuthStore } from '@/store/authStore';
import { cn, timeAgo, formatDate, isOverdue, isDueToday, getErrorMessage } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import PriorityBadge from '@/components/common/PriorityBadge';
import StatusChip from '@/components/common/StatusChip';
import EmptyState from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import type { Task, Status } from '@/types';

type ViewMode = 'list' | 'board';
type GroupBy = 'none' | 'status' | 'priority' | 'project';

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: '', label: 'All Statuses', color: '' },
  { value: 'todo', label: 'To Do', color: 'bg-surface-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'testing', label: 'Testing', color: 'bg-violet-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-500' },
  { value: 'done', label: 'Done', color: 'bg-emerald-500' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'created_at', label: 'Oldest First' },
  { value: 'due_date', label: 'Due Date (Ascending)' },
  { value: '-due_date', label: 'Due Date (Descending)' },
  { value: '-priority', label: 'Priority (High → Low)' },
  { value: 'priority', label: 'Priority (Low → High)' },
];

export default function MyTasksPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [view, setView] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sort, setSort] = useState('-created_at');
  const [showFilters, setShowFilters] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (statusFilter) params.status = statusFilter;
  if (priorityFilter) params.priority = priorityFilter;
  params.sort = sort;
  if (groupBy === 'status') params.group_by = 'status';

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks-full', params],
    queryFn: async () => (await authApi.getMyTasks(params)).data,
  });

  const tasks: Task[] = data?.results ?? [];
  const grouped = data?.grouped;
  const totalCount = data?.count ?? data?.total ?? tasks.length;

  // Client-side grouping for priority/project
  const getGroupedTasks = () => {
    if (groupBy === 'status' && grouped) {
      return Object.entries(grouped as Record<string, Task[]>).map(([key, items]) => ({
        key,
        label: STATUS_OPTIONS.find(s => s.value === key)?.label ?? key,
        tasks: items,
      })).filter(g => g.tasks.length > 0);
    }
    if (groupBy === 'priority') {
      const priorities = ['critical', 'high', 'medium', 'low'];
      return priorities.map(p => ({
        key: p,
        label: p.charAt(0).toUpperCase() + p.slice(1),
        tasks: tasks.filter(t => t.priority === p),
      })).filter(g => g.tasks.length > 0);
    }
    if (groupBy === 'project') {
      const projectMap = new Map<number, { name: string; tasks: Task[] }>();
      tasks.forEach(t => {
        const pid = t.project_id;
        if (!projectMap.has(pid)) {
          projectMap.set(pid, { name: t.story_title?.split(' → ')[0] || `Project #${pid}`, tasks: [] });
        }
        projectMap.get(pid)!.tasks.push(t);
      });
      return Array.from(projectMap.entries()).map(([id, { name, tasks: items }]) => ({
        key: String(id),
        label: name,
        tasks: items,
      }));
    }
    return [{ key: 'all', label: 'All Tasks', tasks }];
  };

  const groups = getGroupedTasks();

  const stats = {
    total: totalCount,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length,
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus);
      qc.invalidateQueries({ queryKey: ['my-tasks-full'] });
      toast.success('Status updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const hasActiveFilters = statusFilter || priorityFilter || search;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            My Tasks
          </h1>
          <p className="text-surface-500 mt-1 ml-[52px]">
            {totalCount} task{totalCount !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 p-0.5 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <button onClick={() => setView('list')} className={cn('p-2 rounded-md transition-all', view === 'list' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-400')}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setView('board')} className={cn('p-2 rounded-md transition-all', view === 'board' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-400')}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Layers, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20' },
          { label: 'To Do', value: stats.todo, icon: Clock, color: 'text-surface-500', bg: 'bg-surface-100 dark:bg-surface-800' },
          { label: 'In Progress', value: stats.inProgress, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Done', value: stats.done, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('flex items-center gap-3 p-3 rounded-xl', s.bg)}
          >
            <s.icon className={cn('w-5 h-5', s.color)} />
            <div>
              <p className="text-lg font-bold">{isLoading ? '—' : s.value}</p>
              <p className="text-[10px] text-surface-500">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="input-field pl-9 py-2"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-ghost py-2 text-sm', hasActiveFilters && 'text-brand-600')}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-brand-500 rounded-full" />
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 bg-white dark:bg-surface-800"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="text-sm border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 bg-white dark:bg-surface-800"
          >
            <option value="none">No Grouping</option>
            <option value="status">Group by Status</option>
            <option value="priority">Group by Priority</option>
          </select>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 bg-white dark:bg-surface-800"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-sm border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 bg-white dark:bg-surface-800"
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }}
                    className="text-sm text-danger flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : tasks.length === 0 && !grouped ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8" />}
          title={hasActiveFilters ? 'No tasks match your filters' : 'No tasks assigned to you'}
          description={hasActiveFilters ? 'Try adjusting your filters' : 'Get started by accepting project invites and getting tasks assigned'}
          action={hasActiveFilters ? (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }} className="btn-secondary">
              Clear Filters
            </button>
          ) : undefined}
        />
      ) : view === 'list' ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              {groupBy !== 'none' && (
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500">{group.label}</h3>
                  <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-full">
                    {group.tasks.length}
                  </span>
                </div>
              )}
              <div className="space-y-2">
                {group.tasks.map((task, i) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    index={i}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STATUS_OPTIONS.filter(s => s.value).map((statusOpt) => {
            const columnTasks = tasks.filter(t => t.status === statusOpt.value);
            return (
              <div key={statusOpt.value} className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('w-2.5 h-2.5 rounded-full', statusOpt.color)} />
                  <h3 className="text-sm font-semibold">{statusOpt.label}</h3>
                  <span className="text-xs text-surface-400 ml-auto">{columnTasks.length}</span>
                </div>
                {columnTasks.map((task) => (
                  <TaskBoardCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskListItem({ task, index, onStatusChange }: { task: Task; index: number; onStatusChange: (id: number, status: string) => void }) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done';
  const dueToday = isDueToday(task.due_date) && task.status !== 'done';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="glass-card p-4 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className="text-xs border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-1.5 bg-white dark:bg-surface-800 shrink-0 mt-0.5"
        >
          {STATUS_OPTIONS.filter(s => s.value).map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={`/stories/${task.story}`}
              className="text-sm font-medium hover:text-brand-600 transition-colors truncate"
            >
              {task.title}
            </Link>
            <ArrowUpRight className="w-3.5 h-3.5 text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
          {task.description && (
            <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-surface-400">{task.story_title}</span>
            {task.due_date && (
              <span className={cn(
                'text-xs flex items-center gap-1',
                overdue ? 'text-red-500 font-medium' : dueToday ? 'text-amber-500' : 'text-surface-400'
              )}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.due_date)}
                {overdue && ' • Overdue'}
                {dueToday && ' • Today'}
              </span>
            )}
            {task.comment_count > 0 && (
              <span className="text-xs text-surface-400 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {task.comment_count}
              </span>
            )}
            {task.attachment_count > 0 && (
              <span className="text-xs text-surface-400 flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> {task.attachment_count}
              </span>
            )}
          </div>
        </div>

        {/* Assigned avatars */}
        <div className="flex items-center -space-x-2 shrink-0">
          {(task.assigned_to_details || []).slice(0, 3).map((u) => (
            <div key={u.id} className="ring-2 ring-white dark:ring-surface-900 rounded-full" title={u.full_name || u.username}>
              <Avatar name={u.full_name || u.username} src={u.avatar_url || undefined} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TaskBoardCard({ task, onStatusChange }: { task: Task; onStatusChange: (id: number, status: string) => void }) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <Link
      to={`/stories/${task.story}`}
      className="block glass-card p-3 hover:shadow-md transition-all group"
    >
      <p className="text-sm font-medium line-clamp-2 group-hover:text-brand-600 transition-colors">{task.title}</p>
      <div className="flex items-center gap-2 mt-2">
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span className={cn('text-[10px]', overdue ? 'text-red-500 font-medium' : 'text-surface-400')}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-surface-400 truncate">{task.story_title}</span>
        <div className="flex items-center gap-1">
          {task.comment_count > 0 && (
            <span className="text-[10px] text-surface-400 flex items-center gap-0.5">
              <MessageSquare className="w-2.5 h-2.5" />{task.comment_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
