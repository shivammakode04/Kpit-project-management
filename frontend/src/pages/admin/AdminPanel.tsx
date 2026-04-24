import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Play, Archive, ArchiveRestore, Download, Shield,
  Users, UserCheck, UserX, Eye, ShieldCheck, MoreVertical,
  BarChart3, Layers, FolderKanban, CheckCircle2, AlertTriangle,
  Mail, Clock, ToggleLeft, ToggleRight, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { projectsApi } from '@/api/projects';
import { jobsApi } from '@/api/search';
import { useArchiveProject } from '@/hooks/useProjects';
import { cn, timeAgo, triggerDownload, getErrorMessage } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import { TableRowSkeleton, Skeleton } from '@/components/ui/Skeleton';
import type { BackgroundJob, User } from '@/types';

type TabKey = 'users' | 'projects' | 'jobs' | 'analytics';

const JOB_COLORS: Record<BackgroundJob['status'], string> = {
  pending: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
};

export default function AdminPanel() {
  const [tab, setTab] = useState<TabKey>('users');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [projSearch, setProjSearch] = useState('');
  const qc = useQueryClient();

  const { data: users, isLoading: usersLoad } = useQuery({
    queryKey: ['admin-users', userSearch, roleFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (userSearch) params.search = userSearch;
      if (roleFilter) params.role = roleFilter;
      return (await authApi.listUsers(params)).data;
    },
  });

  const { data: projectsData, isLoading: projsLoad } = useQuery({
    queryKey: ['projects', 1],
    queryFn: async () => (await projectsApi.list(1)).data,
  });

  const { data: jobsData, isLoading: jobsLoad, refetch: refetchJobs } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => (await jobsApi.list(1)).data,
    refetchInterval: 10_000,
  });

  const { data: workspaceStats } = useQuery({
    queryKey: ['workspace-stats'],
    queryFn: async () => (await authApi.getWorkspaceStats()).data,
  });

  const archiveMutation = useArchiveProject();

  const filteredProjects = (projectsData?.results ?? []).filter((p) =>
    p.name.toLowerCase().includes(projSearch.toLowerCase()),
  );

  const handleExport = async (projectId: number, fmt: 'csv' | 'pdf') => {
    try {
      const { data } = await (fmt === 'csv' ? projectsApi.exportCsv(projectId) : projectsApi.exportPdf(projectId));
      triggerDownload(data as Blob, `project-${projectId}.${fmt}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleTriggerJob = async (jobType: string) => {
    try {
      await jobsApi.trigger(jobType);
      toast.success(`Job "${jobType}" triggered`);
      refetchJobs();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await authApi.updateUserRole(userId, newRole);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Role updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      const { data } = await authApi.toggleUserActive(userId);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(data.detail);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const activeUsers = (users ?? []).filter(u => u.is_active);
  const inactiveUsers = (users ?? []).filter(u => !u.is_active);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-surface-500">Manage users, projects, and system</p>
        </div>
      </div>

      {/* Workspace Stats Overview */}
      {workspaceStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Users', value: workspaceStats.total_members, icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
            { label: 'Projects', value: workspaceStats.total_projects, icon: FolderKanban, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20' },
            { label: 'Tasks', value: workspaceStats.total_tasks, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Stories', value: workspaceStats.total_stories, icon: BarChart3, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn('flex items-center gap-3 p-4 rounded-xl', s.bg)}
            >
              <s.icon className={cn('w-6 h-6', s.color)} />
              <div>
                <p className="text-xl font-bold">{s.value ?? '—'}</p>
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {(['users', 'projects', 'jobs', 'analytics'] as TabKey[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize',
            tab === t ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500 hover:text-surface-700',
          )}>{t === 'jobs' ? 'Background Jobs' : t}</button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Search & Filter */}
          <div className="glass-card p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users by name, email..." className="input-field pl-9" />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 bg-white dark:bg-surface-800">
              <option value="">All Roles</option>
              <option value="admin">Admins</option>
              <option value="member">Members</option>
              <option value="viewer">Viewers</option>
            </select>
          </div>

          {/* Active Users */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">Active Users ({activeUsers.length})</span>
            </div>
            <div className="overflow-x-auto">
              {usersLoad ? <TableRowSkeleton rows={5} /> : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-surface-500 border-b border-surface-100 dark:border-surface-800">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {activeUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.full_name || u.username} src={u.avatar_url} size="sm" />
                            <div>
                              <p className="text-sm font-medium">{u.full_name || u.username}</p>
                              <p className="text-xs text-surface-500">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-surface-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role || 'viewer'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={cn('text-xs border-0 rounded-full px-2.5 py-1 font-semibold uppercase tracking-wider cursor-pointer', ROLE_COLORS[u.role || 'viewer'])}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-surface-500">{timeAgo(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className="btn-ghost p-1.5 text-amber-600 hover:text-amber-700"
                            title="Deactivate user"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Inactive Users */}
          {inactiveUsers.length > 0 && (
            <div className="glass-card overflow-hidden opacity-75">
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold">Deactivated Users ({inactiveUsers.length})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {inactiveUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.full_name || u.username} src={u.avatar_url} size="sm" />
                            <div>
                              <p className="text-sm font-medium line-through text-surface-400">{u.full_name || u.username}</p>
                              <p className="text-xs text-surface-400">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-surface-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded-full font-medium">Deactivated</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className="btn-ghost p-1.5 text-emerald-600 hover:text-emerald-700"
                            title="Reactivate user"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* PROJECTS TAB */}
      {tab === 'projects' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-800">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input value={projSearch} onChange={(e) => setProjSearch(e.target.value)} placeholder="Search projects..." className="input-field pl-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            {projsLoad ? <TableRowSkeleton rows={5} /> : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-surface-500 border-b border-surface-100 dark:border-surface-800">
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Members</th><th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th><th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-sm">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-surface-500">{p.owner_name}</td>
                      <td className="px-4 py-3 text-sm">{p.member_count}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          p.is_archived
                            ? 'bg-surface-100 text-surface-500 dark:bg-surface-800'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400')}>
                          {p.is_archived ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">{timeAgo(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => archiveMutation.mutate(p.id)} className="btn-ghost p-1.5" title={p.is_archived ? 'Restore' : 'Archive'}>
                            {p.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                          </button>
                          <div className="relative group">
                            <button className="btn-ghost p-1.5"><Download className="w-4 h-4" /></button>
                            <div className="absolute right-0 top-full mt-1 w-24 glass-card shadow-lg py-1 hidden group-hover:block z-10">
                              <button onClick={() => handleExport(p.id, 'csv')} className="w-full text-left px-3 py-1 text-xs hover:bg-surface-100 dark:hover:bg-surface-800">CSV</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {/* JOBS TAB */}
      {tab === 'jobs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            {['deadline_reminder', 'notification_cleanup'].map((jt) => (
              <button key={jt} onClick={() => handleTriggerJob(jt)} className="btn-secondary text-sm flex items-center gap-2">
                <Play className="w-3.5 h-3.5" /> Trigger {jt.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              {jobsLoad ? <TableRowSkeleton rows={5} /> : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-surface-500 border-b border-surface-100 dark:border-surface-800">
                      <th className="px-4 py-3">Job Type</th><th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Retries</th><th className="px-4 py-3">Last Run</th>
                      <th className="px-4 py-3">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {(jobsData?.results ?? []).map((job) => (
                      <tr key={job.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm">{job.job_type}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', JOB_COLORS[job.status])}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{job.retry_count}/{job.max_retries}</td>
                        <td className="px-4 py-3 text-sm text-surface-500">{job.executed_at ? timeAgo(job.executed_at) : '—'}</td>
                        <td className="px-4 py-3 text-xs text-danger max-w-[200px] truncate">{job.error_message ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'analytics' && workspaceStats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task Distribution */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-500" /> Workspace Overview
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Total Projects', value: workspaceStats.total_projects, max: workspaceStats.total_projects, color: 'bg-brand-500' },
                  { label: 'Total Stories', value: workspaceStats.total_stories, max: Math.max(workspaceStats.total_stories, workspaceStats.total_tasks), color: 'bg-violet-500' },
                  { label: 'Total Tasks', value: workspaceStats.total_tasks, max: Math.max(workspaceStats.total_stories, workspaceStats.total_tasks), color: 'bg-blue-500' },
                  { label: 'Active Members', value: workspaceStats.total_members, max: workspaceStats.total_members, color: 'bg-cyan-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-surface-600 dark:text-surface-400">{item.label}</span>
                      <span className="font-bold">{item.value}</span>
                    </div>
                    <div className="h-2.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.max > 0 ? (item.value / item.max) * 100 : 0}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', item.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> System Health
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'API Status', status: 'Operational', color: 'bg-emerald-500' },
                  { label: 'Database', status: 'Connected', color: 'bg-emerald-500' },
                  { label: 'Background Jobs', status: (jobsData?.results ?? []).some(j => j.status === 'failed') ? 'Warning' : 'Healthy', color: (jobsData?.results ?? []).some(j => j.status === 'failed') ? 'bg-amber-500' : 'bg-emerald-500' },
                  { label: 'File Storage', status: 'Available', color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', item.color)} />
                      <span className="text-xs font-medium">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
