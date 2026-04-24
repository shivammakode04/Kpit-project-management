import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Search, Mail, Shield, ShieldCheck, Eye,
  CheckCircle2, Clock, AlertTriangle, BarChart3,
  UserCircle, Layers, FolderKanban, Zap,
} from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { cn, timeAgo } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { User } from '@/types';

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: ShieldCheck,
  member: Users,
  viewer: Eye,
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
};

export default function TeamPage() {
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['team-users', search, roleFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      return (await authApi.listUsers(params)).data;
    },
  });

  const { data: selectedDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['user-detail', selectedUser],
    queryFn: async () => (await authApi.getUser(selectedUser!)).data,
    enabled: !!selectedUser,
  });

  const activeUsers = (users ?? []).filter(u => u.is_active);
  const admins = activeUsers.filter(u => u.role === 'admin').length;
  const members = activeUsers.filter(u => u.role === 'member').length;
  const viewers = activeUsers.filter(u => u.role === 'viewer').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Team
          </h1>
          <p className="text-surface-500 mt-1 ml-[52px]">
            {activeUsers.length} team member{activeUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Admins', count: admins, icon: ShieldCheck, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          { label: 'Members', count: members, icon: Users, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Viewers', count: viewers, icon: Eye, gradient: 'from-surface-400 to-surface-500', bg: 'bg-surface-100 dark:bg-surface-800' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('glass-card p-5 flex items-center gap-4')}
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', item.bg)}>
              <item.icon className={cn('w-6 h-6', `bg-gradient-to-r ${item.gradient} bg-clip-text`)} style={{ color: item.gradient.includes('violet') ? '#7c3aed' : item.gradient.includes('blue') ? '#3b82f6' : '#71717a' }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{isLoading ? '—' : item.count}</p>
              <p className="text-xs text-surface-500">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="input-field pl-9 py-2"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 bg-white dark:bg-surface-800"
        >
          <option value="">All Roles</option>
          <option value="admin">Admins</option>
          <option value="member">Members</option>
          <option value="viewer">Viewers</option>
        </select>
      </div>

      {/* Content Grid */}
      <div className="flex gap-6">
        {/* User List */}
        <div className={cn('flex-1 space-y-2', selectedUser && 'hidden lg:block')}>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : activeUsers.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500">No users found</p>
            </div>
          ) : (
            activeUsers.map((u, i) => (
              <motion.button
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedUser(u.id)}
                className={cn(
                  'w-full glass-card p-4 text-left hover:shadow-md transition-all group',
                  selectedUser === u.id && 'ring-2 ring-brand-500 shadow-md',
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={u.full_name || u.username} src={u.avatar_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate group-hover:text-brand-600 transition-colors">
                        {u.full_name || u.username}
                      </p>
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 rounded-full font-medium">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-surface-500">@{u.username}</span>
                      <span className="text-xs text-surface-400">·</span>
                      <span className="text-xs text-surface-400">{u.email}</span>
                    </div>
                  </div>
                  <span className={cn('text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wider', ROLE_COLORS[u.role || 'viewer'])}>
                    {u.role || 'viewer'}
                  </span>
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* User Detail Panel */}
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[380px] shrink-0"
          >
            <div className="glass-card p-6 sticky top-4 space-y-5">
              {detailLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                  <Skeleton className="h-6 w-2/3 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                  </div>
                </div>
              ) : selectedDetail ? (
                <>
                  {/* User Info */}
                  <div className="text-center">
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 lg:hidden"
                    >
                      ✕
                    </button>
                    <div className="mx-auto w-20 h-20 mb-3">
                      <Avatar name={selectedDetail.full_name || selectedDetail.username} src={selectedDetail.avatar_url} size="lg" />
                    </div>
                    <h3 className="text-lg font-bold">{selectedDetail.full_name || selectedDetail.username}</h3>
                    <p className="text-sm text-surface-500">@{selectedDetail.username}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider', ROLE_COLORS[selectedDetail.role || 'viewer'])}>
                        {selectedDetail.role || 'viewer'}
                      </span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-2 text-sm text-surface-500 justify-center">
                    <Mail className="w-4 h-4" />
                    {selectedDetail.email}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Tasks', value: selectedDetail.task_count, icon: Layers, color: 'text-brand-500' },
                      { label: 'Completed', value: selectedDetail.completed_task_count, icon: CheckCircle2, color: 'text-emerald-500' },
                      { label: 'In Progress', value: selectedDetail.in_progress_count, icon: Zap, color: 'text-blue-500' },
                      { label: 'Overdue', value: selectedDetail.overdue_task_count, icon: AlertTriangle, color: 'text-red-500' },
                      { label: 'Projects', value: selectedDetail.project_count, icon: FolderKanban, color: 'text-violet-500' },
                      { label: 'Completion', value: selectedDetail.task_count > 0 ? `${Math.round((selectedDetail.completed_task_count / selectedDetail.task_count) * 100)}%` : '0%', icon: BarChart3, color: 'text-amber-500' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 text-center">
                        <stat.icon className={cn('w-4 h-4 mx-auto mb-1', stat.color)} />
                        <p className="text-lg font-bold">{stat.value}</p>
                        <p className="text-[10px] text-surface-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Workload Bar */}
                  {selectedDetail.task_count > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-surface-500 mb-2">Workload Distribution</p>
                      <div className="h-3 rounded-full overflow-hidden flex bg-surface-200 dark:bg-surface-700">
                        {selectedDetail.completed_task_count > 0 && (
                          <div
                            className="bg-emerald-500 transition-all duration-500"
                            style={{ width: `${(selectedDetail.completed_task_count / selectedDetail.task_count) * 100}%` }}
                            title={`Done: ${selectedDetail.completed_task_count}`}
                          />
                        )}
                        {selectedDetail.in_progress_count > 0 && (
                          <div
                            className="bg-blue-500 transition-all duration-500"
                            style={{ width: `${(selectedDetail.in_progress_count / selectedDetail.task_count) * 100}%` }}
                            title={`In Progress: ${selectedDetail.in_progress_count}`}
                          />
                        )}
                        {selectedDetail.overdue_task_count > 0 && (
                          <div
                            className="bg-red-500 transition-all duration-500"
                            style={{ width: `${(selectedDetail.overdue_task_count / selectedDetail.task_count) * 100}%` }}
                            title={`Overdue: ${selectedDetail.overdue_task_count}`}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-surface-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Done</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Active</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Overdue</span>
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  {selectedDetail.recent_activity?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-surface-500 mb-2">Recent Activity</p>
                      <div className="space-y-2">
                        {selectedDetail.recent_activity.map((log: any) => (
                          <div key={log.id} className="text-xs text-surface-500 flex items-start gap-2">
                            <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                            <div>
                              <span>{log.action}</span>
                              <span className="text-surface-400 ml-1">· {timeAgo(log.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Member since */}
                  <p className="text-xs text-surface-400 text-center">
                    Member since {timeAgo(selectedDetail.created_at)}
                  </p>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
