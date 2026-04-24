import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera, Mail, Shield, Calendar, CheckCircle2, Clock,
  Layers, FolderKanban, AlertTriangle, Zap, Lock, Save, Edit2,
  BarChart3, Activity, ArrowUpRight,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { tasksApi } from '@/api/tasks';
import { cn, timeAgo, formatDate, isOverdue, getErrorMessage } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import PriorityBadge from '@/components/common/PriorityBadge';
import StatusChip from '@/components/common/StatusChip';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Task } from '@/types';
import { Link } from 'react-router-dom';

type TabKey = 'overview' | 'tasks' | 'activity' | 'security';

export function Profile() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>('overview');
  const [editing, setEditing] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const { data: userDetail } = useQuery({
    queryKey: ['user-detail', user?.id],
    queryFn: async () => (await authApi.getUser(user!.id)).data,
    enabled: !!user?.id,
  });

  const { data: myTasksData } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => (await tasksApi.getMyTasks()).data,
  });

  const { data: activityData } = useQuery({
    queryKey: ['my-activity'],
    queryFn: async () => (await authApi.getMyActivity()).data,
  });

  const myTasks: Task[] = myTasksData?.results ?? [];
  const recentTasks = myTasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const stats = userDetail ? {
    totalTasks: userDetail.task_count,
    completed: userDetail.completed_task_count,
    inProgress: userDetail.in_progress_count,
    overdue: userDetail.overdue_task_count,
    projects: userDetail.project_count,
    completionRate: userDetail.task_count > 0 ? Math.round((userDetail.completed_task_count / userDetail.task_count) * 100) : 0,
  } : null;

  const profileForm = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    },
  });

  const handleProfileSave = async (data: { full_name: string; email: string }) => {
    try {
      const { data: updated } = await authApi.updateProfile(data);
      updateUser(updated);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePasswordChange = async (data: { old_password: string; new_password: string; new_password_confirm: string }) => {
    try {
      await authApi.changePassword(data);
      passwordForm.reset();
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Avatar must be under 5MB'); return; }
    try {
      const { data } = await authApi.uploadAvatar(file);
      updateUser(data);
      qc.invalidateQueries({ queryKey: ['user-detail'] });
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-brand-600 via-violet-600 to-cyan-500 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Avatar & Info */}
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl ring-4 ring-white dark:ring-surface-900 overflow-hidden bg-white dark:bg-surface-800 shadow-lg">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold">
                    {(user?.full_name || user?.username || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => avatarRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user?.full_name || user?.username}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-sm text-surface-500 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {user?.email}
                </span>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider',
                  user?.role === 'admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                  user?.role === 'member' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                )}>
                  {user?.role || 'viewer'}
                </span>
                <span className="text-xs text-surface-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Joined {timeAgo(user?.created_at || '')}
                </span>
              </div>
            </div>

            <button onClick={() => { setEditing(!editing); setTab('overview'); }} className="btn-secondary text-sm">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6">
              {[
                { label: 'Tasks', value: stats.totalTasks, icon: Layers, color: 'text-brand-500' },
                { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500' },
                { label: 'In Progress', value: stats.inProgress, icon: Zap, color: 'text-blue-500' },
                { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-500' },
                { label: 'Projects', value: stats.projects, icon: FolderKanban, color: 'text-violet-500' },
                { label: 'Completion', value: `${stats.completionRate}%`, icon: BarChart3, color: 'text-amber-500' },
              ].map((s) => (
                <div key={s.label} className="text-center p-2 bg-surface-50 dark:bg-surface-800 rounded-xl">
                  <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-surface-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {(['overview', 'tasks', 'activity', 'security'] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500 hover:text-surface-700',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {editing ? (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-4">Edit Profile</h3>
              <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <input {...profileForm.register('full_name')} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input type="email" {...profileForm.register('email')} className="input-field" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1"><Save className="w-4 h-4" /> Save Changes</button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Completion Chart */}
              {stats && stats.totalTasks > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-500" /> Task Progress
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="relative w-28 h-28">
                      <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-surface-200 dark:text-surface-700" />
                        <circle
                          cx="60" cy="60" r="50" fill="none" strokeWidth="10" strokeLinecap="round"
                          className="text-brand-500"
                          strokeDasharray={`${stats.completionRate * 3.14} ${314 - stats.completionRate * 3.14}`}
                          style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">{stats.completionRate}%</span>
                        <span className="text-[10px] text-surface-500">Complete</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[
                        { label: 'Completed', value: stats.completed, total: stats.totalTasks, color: 'bg-emerald-500' },
                        { label: 'In Progress', value: stats.inProgress, total: stats.totalTasks, color: 'bg-blue-500' },
                        { label: 'Overdue', value: stats.overdue, total: stats.totalTasks, color: 'bg-red-500' },
                      ].map(bar => (
                        <div key={bar.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-surface-600 dark:text-surface-400">{bar.label}</span>
                            <span className="font-medium">{bar.value}</span>
                          </div>
                          <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-500', bar.color)}
                              style={{ width: `${bar.total > 0 ? (bar.value / bar.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {recentTasks.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Layers className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500">No tasks assigned to you yet</p>
            </div>
          ) : recentTasks.map((task) => (
            <Link
              key={task.id}
              to={`/stories/${task.story}`}
              className="glass-card p-4 flex items-center gap-3 hover:shadow-md transition-all group"
            >
              <StatusChip status={task.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-brand-600 transition-colors">{task.title}</p>
                <p className="text-xs text-surface-500">{task.story_title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={task.priority} />
                {task.due_date && (
                  <span className={cn('text-xs', isOverdue(task.due_date) && task.status !== 'done' ? 'text-red-500' : 'text-surface-400')}>
                    {formatDate(task.due_date)}
                  </span>
                )}
                <ArrowUpRight className="w-3.5 h-3.5 text-surface-400 opacity-0 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
          <Link to="/my-tasks" className="block text-center text-sm text-brand-600 hover:text-brand-700 font-medium py-2">
            View all tasks →
          </Link>
        </motion.div>
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {(activityData?.results ?? []).length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Activity className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500">No activity recorded yet</p>
            </div>
          ) : (activityData?.results ?? []).map((log: any) => (
            <div key={log.id} className="glass-card p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{log.user_name || 'You'}</span>{' '}
                  {log.action}
                </p>
                <p className="text-xs text-surface-400 mt-0.5">{timeAgo(log.created_at)}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-surface-500" /> Change Password
            </h3>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1.5">Current Password</label>
                <input type="password" {...passwordForm.register('old_password')} className="input-field" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <input type="password" {...passwordForm.register('new_password')} className="input-field" placeholder="Min. 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                <input type="password" {...passwordForm.register('new_password_confirm')} className="input-field" placeholder="Re-enter new password" />
              </div>
              <button type="submit" className="btn-primary">
                <Lock className="w-4 h-4" /> Update Password
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return <Profile />;
}
