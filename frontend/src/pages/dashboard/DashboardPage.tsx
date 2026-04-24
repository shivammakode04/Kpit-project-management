import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Users, Layers, ArrowRight, Activity,
  BarChart3, Target, Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { projectsApi } from '@/api/projects';
import { tasksApi } from '@/api/tasks';
import type { Task, Project } from '@/types';
import { cn, timeAgo, formatDate, isOverdue } from '@/lib/utils';
import PriorityBadge from '@/components/common/PriorityBadge';
import StatusChip from '@/components/common/StatusChip';

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

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => !p.is_archived).length;
  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress').length;
  const overdueTasks = myTasks.filter((t) => isOverdue(t.due_date) && t.status !== 'done').length;
  const todoTasks = myTasks.filter((t) => t.status === 'todo').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isLoading = projectsLoading || tasksLoading;

  const stats = [
    { label: 'Active Projects', value: activeProjects, icon: FolderKanban, color: 'from-brand-500 to-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { label: 'My Tasks', value: totalTasks, icon: Layers, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Completed', value: completedTasks, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Overdue', value: overdueTasks, icon: AlertTriangle, color: 'from-red-500 to-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  const upcomingTasks = myTasks
    .filter((t) => t.status !== 'done' && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const recentTasks = myTasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">{user?.full_name || user?.username}</span>
          </h1>
          <p className="text-surface-500 mt-1">Here's what's happening across your projects</p>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 group hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-5 h-5 bg-gradient-to-r bg-clip-text', stat.color.replace('from-', 'text-').split(' ')[0])} />
              </div>
              {stat.label === 'Overdue' && stat.value > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-bold">{isLoading ? '—' : stat.value}</p>
            <p className="text-xs text-surface-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-500" /> Task Completion
          </h3>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-200 dark:text-surface-700" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  strokeWidth="8" strokeLinecap="round"
                  className="text-brand-500"
                  strokeDasharray={`${completionRate * 3.14} ${314 - completionRate * 3.14}`}
                  style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{completionRate}%</span>
                <span className="text-[10px] text-surface-500">Complete</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mt-2">
            <div>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{todoTasks}</p>
              <p className="text-[10px] text-surface-500">To Do</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{inProgressTasks}</p>
              <p className="text-[10px] text-surface-500">In Progress</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{completedTasks}</p>
              <p className="text-[10px] text-surface-500">Done</p>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Upcoming Deadlines
            </h3>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-surface-400">
              <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <Link
                  key={task.id}
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
                      'text-xs font-medium',
                      isOverdue(task.due_date) ? 'text-red-500' : 'text-surface-500'
                    )}>
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Projects + Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-brand-500" /> My Projects
            </h3>
            <Link to="/projects" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-surface-400">
              <FolderKanban className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No projects yet</p>
              <Link to="/projects" className="text-brand-600 text-xs mt-1 hover:underline">Create one</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.filter(p => !p.is_archived).slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {project.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-brand-600 transition-colors">{project.name}</p>
                    <p className="text-xs text-surface-500">{project.member_count} member{project.member_count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="shrink-0">
                    <div className="w-16 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress_percentage ?? 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-surface-500 text-right mt-0.5">{project.progress_percentage ?? 0}%</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-violet-500" /> Recent Tasks
          </h3>
          {recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-surface-400">
              <Layers className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No tasks assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
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
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
