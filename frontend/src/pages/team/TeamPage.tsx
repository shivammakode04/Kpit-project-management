import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Search, Shield, Crown,
  Eye, CheckCircle2, Send, Loader2, FolderKanban,
  ChevronDown, UserCheck, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { projectsApi } from '@/api/projects';
import { teamsApi } from '@/api/teams';
import { cn, getErrorMessage } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Project, User, ProjectMember } from '@/types';

type TabKey = 'all-users' | 'my-team';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const STATUS_COLORS: Record<string, string> = {
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function TeamPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Team state
  const [activeTab, setActiveTab] = useState<TabKey>('all-users');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<Set<number>>(new Set());
  const [teamLoading, setTeamLoading] = useState(false);
  const [invitingUser, setInvitingUser] = useState<number | null>(null);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await projectsApi.list();
      const userProjects = res.data.results ?? [];
      setProjects(userProjects);

      if (userProjects.length > 0) {
        setSelectedProjectId(userProjects[0].id);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Load team data when project changes
  const loadTeamData = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      setTeamLoading(true);
      const [usersRes, membersRes] = await Promise.all([
        teamsApi.getAllUsers(selectedProjectId),
        teamsApi.getTeamMembers(selectedProjectId),
      ]);
      setAllUsers(usersRes.data ?? []);
      setTeamMembers(membersRes.data ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTeamLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      loadTeamData();
      setInvitedUsers(new Set());
      setSearchQuery('');
    }
  }, [selectedProjectId, loadTeamData]);

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!selectedProjectId) return;
    try {
      const res = await teamsApi.getAllUsers(selectedProjectId, query || undefined);
      setAllUsers(res.data ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Invite user
  const handleInvite = async (userId: number) => {
    if (!selectedProjectId) return;
    try {
      setInvitingUser(userId);
      await teamsApi.inviteUser(selectedProjectId, userId);
      setInvitedUsers((prev) => new Set([...prev, userId]));
      toast.success('Invitation sent! The user will receive a notification.');
      // Refresh data
      loadTeamData();
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setInvitingUser(null);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // -- RENDER --

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center">
            <FolderKanban className="w-8 h-8 text-surface-400" />
          </div>
          <h2 className="text-xl font-semibold">No Projects Found</h2>
          <p className="text-surface-500 max-w-md mx-auto">
            Create a project first to manage team members and send invitations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-sm text-surface-500">Manage project members &amp; invitations</p>
          </div>
        </div>

        {/* Project selector */}
        <div className="relative w-full sm:w-64">
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center justify-between w-full h-10 px-3 text-sm border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 hover:border-brand-400 transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <FolderKanban className="w-4 h-4 text-brand-500 shrink-0" />
              {selectedProject?.name || 'Select project'}
            </span>
            <ChevronDown className={cn('w-4 h-4 text-surface-400 transition-transform', projectDropdownOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {projectDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-xl max-h-60 overflow-auto"
                >
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setProjectDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2',
                        p.id === selectedProjectId
                          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-700',
                      )}
                    >
                      <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Project info banner */}
      {selectedProject && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center shrink-0">
            <FolderKanban className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm">{selectedProject.name}</h2>
            <p className="text-xs text-surface-500 truncate">{selectedProject.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-surface-500 shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span>{selectedProject.member_count} member{selectedProject.member_count !== 1 ? 's' : ''}</span>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {([
          { key: 'all-users' as TabKey, label: 'All Users', icon: UserPlus },
          { key: 'my-team' as TabKey, label: 'My Team', icon: Users },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              activeTab === t.key
                ? 'bg-white dark:bg-surface-700 shadow-sm'
                : 'text-surface-500 hover:text-surface-700',
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ALL USERS TAB */}
      {activeTab === 'all-users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Search */}
          <div className="glass-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="input-field pl-9"
              />
            </div>
          </div>

          {/* Users list */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-semibold">Available Users ({allUsers.length})</span>
            </div>

            {teamLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : allUsers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto bg-surface-100 dark:bg-surface-800 rounded-xl flex items-center justify-center mb-3">
                  <UserCheck className="w-6 h-6 text-surface-400" />
                </div>
                <p className="text-sm text-surface-500 font-medium">No users available to invite</p>
                <p className="text-xs text-surface-400 mt-1">All registered users are already members of this project</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {allUsers.map((user, i) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar name={user.full_name || user.username} src={user.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name || user.username}</p>
                        <p className="text-xs text-surface-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInvite(user.id)}
                      disabled={invitedUsers.has(user.id) || invitingUser === user.id}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 ml-3',
                        invitedUsers.has(user.id)
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default'
                          : 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40',
                      )}
                    >
                      {invitingUser === user.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : invitedUsers.has(user.id) ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Invited
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send Invite
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* MY TEAM TAB */}
      {activeTab === 'my-team' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold">Team Members ({teamMembers.length})</span>
            </div>

            {teamLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto bg-surface-100 dark:bg-surface-800 rounded-xl flex items-center justify-center mb-3">
                  <AlertTriangle className="w-6 h-6 text-surface-400" />
                </div>
                <p className="text-sm text-surface-500 font-medium">No team members yet</p>
                <p className="text-xs text-surface-400 mt-1">Switch to "All Users" tab to invite people</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {teamMembers.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar
                        name={member.user_detail?.full_name || member.user_detail?.username || 'Unknown'}
                        src={member.user_detail?.avatar_url}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.user_detail?.full_name || member.user_detail?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-surface-500 truncate">
                          {member.user_detail?.email || ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider',
                        STATUS_COLORS[member.status] || STATUS_COLORS.accepted,
                      )}>
                        {member.status}
                      </span>
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider',
                        ROLE_COLORS[member.role] || ROLE_COLORS.member,
                      )}>
                        {member.role}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}