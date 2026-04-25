import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban, CheckCircle2, Clock, AlertTriangle,
  Layers, ArrowRight, Activity, Target, Zap, Users,
  TrendingUp, Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { projectsApi } from '@/api/projects';
import { tasksApi } from '@/api/tasks';
import type { Task, Project } from '@/types';
import { cn, timeAgo, formatDate, isOverdue } from '@/lib/utils';
import PriorityBadge from '@/components/common/PriorityBadge';
import StatusChip from '@/components/common/StatusChip';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 1],
    queryFn: async () => (await projectsApi.list(1)).data,
  });

  const { data: myTasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => (await tasksApi.getMyTasks()).data,
  });

  const projects = projectsData?.results ?? [];
  const myTasks = myTasksData?.results ?? [];

  const activeProjects = projects.filter((p) => !p.is_archived).length;
  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress').length;
  const overdueTasks = myTasks.filter((t) => isOverdue(t.due_date) && t.status !== 'done').length;
  const todoTasks = myTasks.filter((t) => t.status === 'todo').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isLoading = projectsLoading || tasksLoading;

  const stats = [
    {
      label: 'Active Projects', value: activeProjects, icon: FolderKanban,
      gradient: 'from-brand-500 to-indigo-600',
      bg: 'bg-brand-50 dark:bg-brand-900/15',
      iconColor: 'text-brand-600',
    },
    {
      label: 'My Tasks', value: totalTasks, icon: Layers,
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50 dark:bg-blue-900/15',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Completed', value: completedTasks, icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/15',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Overdue', value: overdueTasks, icon: AlertTriangle,
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50 dark:bg-red-900/15',
      iconColor: 'text-red-600',
    },
  ];

  const upcomingTasks = myTasks
    .filter((t) => t.status !== 'done' && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const recentTasks = myTasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold"
          >
            Welcome back, <span className="text-gradient-brand">{user?.full_name || user?.username}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-surface-500 mt-1.5"
          >
            Here's what's happening across your projects
          </motion.p>
        </div>
        <Link to="/projects" className="btn-primary hidden md:flex">
          <FolderKanban className="w-4 h-4" /> View Projects
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-5 h-5', stat.iconColor)} />
              </div>
              {stat.label === 'Overdue' && stat.value > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/30" />
              )}
            </div>
            <p className="text-2xl font-bold">{isLoading ? '—' : stat.value}</p>
            <p className="text-xs text-surface-500 mt-1 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Ring */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-500" /> Task Completion
          </h3>
          <div className="flex items-center justify-center py-2">
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-100 dark:text-surface-800" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  strokeWidth="6" strokeLinecap="round"
                  className="text-brand-500"
                  strokeDasharray={`${completionRate * 3.14} ${314 - completionRate * 3.14}`}
                  style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{completionRate}%</span>
                <span className="text-[10px] text-surface-500 font-medium">Complete</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center mt-4">
            {[
              { label: 'To Do', value: todoTasks, color: 'text-surface-600 dark:text-surface-400' },
              { label: 'In Progress', value: inProgressTasks, color: 'text-blue-600' },
              { label: 'Done', value: completedTasks, color: 'text-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="p-2 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                <p className={cn('text-lg font-bold', item.color)}>{item.value}</p>
                <p className="text-[10px] text-surface-500 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Upcoming Deadlines
            </h3>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-surface-400">
              <CheckCircle2 className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No upcoming deadlines</p>
              <p className="text-xs mt-1">You're all caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-1">
              {upcomingTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                >
                  <Link
                    to={`/stories/${task.story}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all group"
                  >
                    <StatusChip status={task.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-brand-600 transition-colors">{task.title}</p>
                      <p className="text-xs text-surface-500">{task.story_title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={task.priority} />
                      <span className={cn(
                        'text-xs font-medium flex items-center gap-1',
                        isOverdue(task.due_date) ? 'text-red-500' : 'text-surface-500'
                      )}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.due_date)}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Projects + Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-brand-500" /> My Projects
            </h3>
            <Link to="/projects" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-surface-400">
              <FolderKanban className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No projects yet</p>
              <Link to="/projects" className="text-brand-600 text-xs mt-2 hover:underline font-medium">Create one →</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.filter(p => !p.is_archived).slice(0, 5).map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                      {project.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-brand-600 transition-colors">{project.name}</p>
                      <div className="flex items-center gap-2 text-xs text-surface-500">
                        <Users className="w-3 h-3" />
                        <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <div className="w-16 h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress_percentage ?? 0}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.05 }}
                          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
                        />
                      </div>
                      <p className="text-[10px] text-surface-500 text-right mt-0.5 font-medium">{project.progress_percentage ?? 0}%</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-violet-500" /> Recent Tasks
          </h3>
          {recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-surface-400">
              <Layers className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No tasks assigned yet</p>
              <p className="text-xs mt-1">Tasks will appear here when assigned</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                >
                  <Link
                    to={`/stories/${task.story}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all group"
                  >
                    <StatusChip status={task.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-brand-600 transition-colors">{task.title}</p>
                      <p className="text-xs text-surface-500">{timeAgo(task.created_at)}</p>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
