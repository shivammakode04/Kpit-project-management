import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, X, Shield, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useProjectMembers, useAcceptedProjectMembers, useAddMember, useRemoveMember, useChangeMemberRole } from '@/hooks/useProjects';
import { projectsApi } from '@/api/projects';
import { cn, getErrorMessage } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import type { ProjectMember } from '@/types';

interface MembersPageProps {}

export default function MembersPage({}: MembersPageProps) {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'team' | 'directory'>('team');
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId);
  const { data: acceptedMembers } = useAcceptedProjectMembers(projectId);
  const { data: allUsers } = useQuery({
    queryKey: ['users-directory', projectId, search],
    queryFn: async () => (await projectsApi.getUsersDirectory(projectId, search || undefined)).data,
    enabled: tab === 'directory',
  });

  const addMember = useAddMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const changeRole = useChangeMemberRole(projectId);

  const handleInvite = async (userId: number) => {
    try {
      await projectsApi.inviteMember(projectId, userId);
      toast.success('Invitation sent');
      qc.invalidateQueries({ queryKey: ['project-members', projectId] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const acceptedMemberUsers = acceptedMembers?.map((m) => m.user_detail) ?? [];

  const filteredUsers = allUsers?.filter(u =>
    !members?.find(m => m.user === u.id) &&
    (u.full_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Members</h1>
          <p className="text-gray-600 mt-1">Manage team members and permissions</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{members?.length || 0}</p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{acceptedMemberUsers.length}</p>
              <p className="text-sm text-gray-600">Active Members</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{members?.filter(m => m.status === 'pending').length || 0}</p>
              <p className="text-sm text-gray-600">Pending Invites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isAdmin && (
        <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg mb-6">
          <button
            onClick={() => setTab('team')}
            className={cn(
              'flex-1 py-2 text-sm rounded-md font-medium transition-colors',
              tab === 'team'
                ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
            )}
          >
            My Team
          </button>
          <button
            onClick={() => setTab('directory')}
            className={cn(
              'flex-1 py-2 text-sm rounded-md font-medium transition-colors',
              tab === 'directory'
                ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
            )}
          >
            User Directory
          </button>
        </div>
      )}

      {/* Team Tab */}
      {tab === 'team' && (
        <div className="space-y-4">
          {membersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : members?.length === 0 ? (
            <EmptyState icon={<Users className="w-6 h-6" />} title="No team members yet" description="Invite team members to start collaborating" />
          ) : (
            <div className="space-y-3">
              {members?.map((member) => (
                <div key={member.id} className="bg-white dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.user_detail.full_name || member.user_detail.username} src={member.user_detail.avatar_url} size="md" />
                      <div>
                        <p className="font-medium">{member.user_detail.full_name || member.user_detail.username}</p>
                        <p className="text-sm text-gray-600">@{member.user_detail.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide",
                        member.status === 'accepted' 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {member.status}
                      </span>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <select
                            value={member.role}
                            onChange={(e) => changeRole.mutate({ userId: member.user_detail.id, role: e.target.value })}
                            className="text-xs border border-surface-200 dark:border-surface-700 rounded px-2 py-1 bg-white dark:bg-surface-800"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => removeMember.mutate(member.user_detail.id)}
                            className="btn-ghost p-1 text-danger"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Directory Tab */}
      {tab === 'directory' && isAdmin && (
        <div className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
            />
          </div>
          {filteredUsers?.length === 0 ? (
            <EmptyState icon={<Search className="w-6 h-6" />} title="No users found" description="Try adjusting your search terms" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredUsers?.map((user) => (
                <div key={user.id} className="bg-white dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.full_name || user.username} src={user.avatar_url} size="md" />
                      <div>
                        <p className="font-medium">{user.full_name || user.username}</p>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInvite(user.id)}
                      className="btn-primary text-sm px-3 py-2"
                    >
                      Invite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-surface-900 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-800">
                  <h2 className="text-lg font-semibold">Invite Team Member</h2>
                  <button onClick={() => setShowInviteModal(false)} className="btn-ghost p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Search for users above and click "Invite" to add them to your project team.
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
