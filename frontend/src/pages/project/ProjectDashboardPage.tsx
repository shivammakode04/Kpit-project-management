import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, BarChart, PieChart,
  TrendingUp, Users, Calendar, Clock, Target, 
  Activity, FileText, CheckCircle, AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/api';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import type { Project, UserStory, Task } from '@/types';

interface ProjectAnalytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  totalStories: number;
  completedStories: number;
  totalHours: number;
  averageStoryPoints: number;
}

export default function ProjectDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => (await projectsApi.get(projectId)).data,
    enabled: !!projectId,
  });

  const { data: analytics } = useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: async () => {
      const response = await projectsApi.getAnalytics(projectId);
      return response.data;
    },
    enabled: !!projectId,
  });

  const { data: stories } = useQuery({
    queryKey: ['project-stories', projectId],
    queryFn: async () => (await projectsApi.getStories(projectId)).data,
    enabled: !!projectId,
  });

  const { data: tasks } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => (await projectsApi.getTasks(projectId)).data,
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <EmptyState 
          icon={<Target className="w-6 h-6" />} 
          title="Project not found" 
          description="The project you're looking for doesn't exist or you don't have access to it." 
        />
      </div>
    );
  }

  const statusColor = project.status === 'active' ? 'text-green-600' : 
                    project.status === 'on_hold' ? 'text-amber-600' : 
                    project.status === 'completed' ? 'text-blue-600' : 'text-gray-600';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/projects/${projectId}/members`)}
            className="btn-secondary"
          >
            <Users className="w-4 h-4" />
            Team Members
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="btn-primary"
          >
            <FileText className="w-4 h-4" />
            View Board
          </button>
        </div>
      </div>

      {/* Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              project.status === 'active' && "bg-green-100 dark:bg-green-900/20",
              project.status === 'on_hold' && "bg-amber-100 dark:bg-amber-900/20",
              project.status === 'completed' && "bg-blue-100 dark:bg-blue-900/20",
              project.status === 'cancelled' && "bg-red-100 dark:bg-red-900/20"
            )}>
              {project.status === 'active' && <CheckCircle className="w-6 h-6 text-green-600" />}
              {project.status === 'on_hold' && <AlertCircle className="w-6 h-6 text-amber-600" />}
              {project.status === 'completed' && <CheckCircle className="w-6 h-6 text-blue-600" />}
              {project.status === 'cancelled' && <AlertCircle className="w-6 h-6 text-red-600" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Project Status</h3>
              <p className={cn("text-2xl font-bold", statusColor)}>
                {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ') : 'Unknown'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Timeline</p>
            <div className="space-y-1">
              {project.start_date && (
                <div className="flex justify-between text-sm">
                  <span>Start Date:</span>
                  <span className="font-medium">{new Date(project.start_date).toLocaleDateString()}</span>
                </div>
              )}
              {project.end_date && (
                <div className="flex justify-between text-sm">
                  <span>End Date:</span>
                  <span className="font-medium">{new Date(project.end_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Duration</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.start_date && project.end_date ? 
                  Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))
                  : '-'
                } days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Time Tracking</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Estimated Hours:</span>
                  <span className="font-medium">{project.estimated_hours || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Actual Hours:</span>
                  <span className="font-medium">{project.actual_hours || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Statistics */}
        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Task Statistics</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics?.totalTasks || 0}</p>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{analytics?.completedTasks || 0}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">{analytics?.inProgressTasks || 0}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-600">{analytics?.todoTasks || 0}</p>
                  <p className="text-sm text-gray-600">To Do</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Story Statistics */}
        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/20 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Story Statistics</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics?.totalStories || 0}</p>
                  <p className="text-sm text-gray-600">Total Stories</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{analytics?.completedStories || 0}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{analytics?.averageStoryPoints || 0}</p>
                  <p className="text-sm text-gray-600">Avg Points</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Overall Progress</h3>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Project Completion</span>
                  <span className="text-lg font-bold">{project.progress_percentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-green-500 dark:bg-green-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <Activity className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Recent Stories</h3>
          </div>
        </div>
        <div className="space-y-3 mt-4">
          {stories?.slice(0, 5).map((story: UserStory) => (
            <div key={story.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-3 h-3 rounded-full flex items-center justify-center text-xs font-semibold",
                  story.status === 'done' && "bg-green-100 text-green-700",
                  story.status === 'in_progress' && "bg-blue-100 text-blue-700",
                  story.status === 'todo' && "bg-gray-100 text-gray-700",
                  story.status === 'blocked' && "bg-red-100 text-red-700",
                  story.status === 'testing' && "bg-amber-100 text-amber-700"
                )}>
                  {story.status === 'done' && '✓'}
                  {story.status === 'in_progress' && '→'}
                  {story.status === 'todo' && '○'}
                  {story.status === 'blocked' && '⚠'}
                  {story.status === 'testing' && '⚡'}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{story.title}</p>
                  <p className="text-sm text-gray-600">
                    {story.task_count} tasks • {story.story_points || 0} points
                  </p>
                </div>
              </div>
              <div className="text-right ml-4">
                <span className="text-xs text-gray-500">
                  {new Date(story.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
