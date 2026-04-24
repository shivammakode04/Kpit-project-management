import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Play, Archive, ArchiveRestore, Download } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { projectsApi } from '@/api/projects';
import { jobsApi } from '@/api/search';
import { useArchiveProject, useChangeMemberRole } from '@/hooks/useProjects';
import { cn, timeAgo, triggerDownload, getErrorMessage } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import type { BackgroundJob, User } from '@/types';

type TabKey = 'users' | 'projects' | 'jobs';

const JOB_COLORS: Record<BackgroundJob['status'], string> = {
  pending: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminPanel() {
  const [tab, setTab] = useState<TabKey>('users');
  const [userSearch, setUserSearch] = useState('');
  const [projSearch, setProjSearch] = useState('');

  const { data: users, isLoading: usersLoad } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await authApi.listUsers()).data,
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
  const archiveMutation = useArchiveProject();

  const filteredUsers = (users ?? []).filter((u) =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {(['users', 'projects', 'jobs'] as TabKey[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize',
            tab === t ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500 hover:text-surface-700',
          )}>{t === 'jobs' ? 'Background Jobs' : t}</button>
        ))}
      </div>

      {/* USERS */}
      {tab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-800">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users..." className="input-field pl-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            {usersLoad ? <TableRowSkeleton rows={5} /> : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-surface-500 border-b border-surface-100 dark:border-surface-800">
                    <th className="px-4 py-3">User</th><th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th><th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filteredUsers.map((u) => <UserRow key={u.id} user={u} />)}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {/* PROJECTS */}
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
                              <button onClick={() => handleExport(p.id, 'pdf')} className="w-full text-left px-3 py-1 text-xs hover:bg-surface-100 dark:hover:bg-surface-800">PDF</button>
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

      {/* JOBS */}
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
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const changeRole = useChangeMemberRole(0);
  return (
    <tr className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.full_name || user.username} src={user.avatar_url} size="sm" />
          <div>
            <p className="text-sm font-medium">{user.full_name || user.username}</p>
            <p className="text-xs text-surface-500">@{user.username}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-surface-500">{user.email}</td>
      <td className="px-4 py-3">
        <select
          defaultValue={user.role}
          onChange={(e) => changeRole.mutate({ userId: user.id, role: e.target.value })}
          className="text-xs border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-1 bg-white dark:bg-surface-800 capitalize"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </td>
      <td className="px-4 py-3 text-sm text-surface-500">{timeAgo(user.created_at)}</td>
    </tr>
  );
}
