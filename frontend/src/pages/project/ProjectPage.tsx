import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, ArchiveRestore, Plus, ChevronRight, Search, X } from 'lucide-react';
import { useProjectMembers, useAcceptedProjectMembers, useArchiveProject, useAddMember, useRemoveMember, useChangeMemberRole } from '@/hooks/useProjects';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import CreateStoryModal from '@/components/modals/CreateStoryModal';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import { Skeleton, KanbanCardSkeleton } from '@/components/ui/Skeleton';
import { cn, getErrorMessage, getBookmarks, toggleBookmark } from '@/lib/utils'; 
import type { Task, UserStory, Status, Priority, ProjectMember, User } from '@/types';
import { Breadcrumbs, useProjectBreadcrumbs } from '@/components/layout/Breadcrumbs';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectsApi, storiesApi, tasksApi } from '@/api';
import { useQuery } from '@tanstack/react-query';

interface Filters { search: string; priority: Priority | ''; assignee: string; starred: boolean; }

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
    const [filters, setFilters] = useState<Filters>({ search: '', priority: '', assignee: '', starred: false });
  const [bookmarks, setBookmarks] = useState<number[]>(() => getBookmarks(user?.id));

  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'admin' || user?.role === 'member';

  const { data: project, isLoading: projLoad } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => (await projectsApi.get(projectId)).data,
    enabled: !!projectId,
  });
  const { data: storiesData, isLoading: storiesLoad } = useQuery({
    queryKey: ['stories', projectId, 1],
    queryFn: async () => (await storiesApi.list(projectId, 1)).data,
    enabled: !!projectId,
  });
  const stories = storiesData?.results ?? [];
  const storyKey = stories.map((s: UserStory) => s.id).join(',');
  const { data: allTasksRaw, isLoading: tasksLoad } = useQuery({
    queryKey: ['project-tasks', projectId, storyKey],
    queryFn: async () => {
      if (!stories.length) return [];
      const res = await Promise.all(stories.map(async (s: UserStory) => (await tasksApi.list(s.id)).data.results));
      return res.flat();
    },
    enabled: stories.length > 0,
    refetchInterval: 60_000,
  });
  const { data: members } = useProjectMembers(projectId);
  const { data: acceptedMembers } = useAcceptedProjectMembers(projectId);
  const archiveMutation = useArchiveProject();
  const addMember = useAddMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const changeRole = useChangeMemberRole(projectId);
  const acceptedMemberUsers = acceptedMembers?.map((m) => m.user_detail) ?? [];
  const allTasks: Task[] = allTasksRaw ?? [];

  const filtered = allTasks.filter((t) => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignee && String(t.assigned_to) !== filters.assignee) return false;
    if (filters.starred && !bookmarks.includes(t.id)) return false;
    return true;
  });

  const handleStatusChange = useCallback(async (taskId: number, status: string) => {
    const prev = allTasks.find((t) => t.id === taskId);
    if (!prev) return;
    qc.setQueryData<Task[]>(['project-tasks', projectId, storyKey], (old) =>
      old ? old.map((t) => t.id === taskId ? { ...t, status: status as Status } : t) : [],
    );
    try {
      await tasksApi.updateStatus(taskId, status);
    } catch (err) {
      qc.setQueryData<Task[]>(['project-tasks', projectId, storyKey], (old) =>
        old ? old.map((t) => t.id === taskId ? { ...t, status: prev.status } : t) : [],
      );
      toast.error(getErrorMessage(err));
    }
  }, [allTasks, qc, projectId, storyKey]);


  if (projLoad) return <ProjectSkeleton />;

  const breadcrumbs = useProjectBreadcrumbs(projectId);

  return (
    <div className="-m-4 md:-m-6 lg:-m-8 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-800">
        <div className="px-6 py-3">
          <Breadcrumbs {...breadcrumbs} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {panelOpen && (
          <motion.aside initial={{ width: 0 }} animate={{ width: 260 }} exit={{ width: 0 }} transition={{ duration: 0.25 }}
            className="shrink-0 border-r border-surface-200 dark:border-surface-800 flex flex-col bg-white dark:bg-surface-900 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800">
              <div className="flex items-center justify-between">
                <h2 className="font-bold truncate text-sm">{project?.name}</h2>
                {isAdmin && (
                  <button onClick={() => archiveMutation.mutate(projectId)} className="btn-ghost p-1" title="Archive/Restore">
                    {project?.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {project?.description && <p className="text-xs text-surface-500 mt-1 line-clamp-2">{project.description}</p>}
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 px-2 py-2">Stories</p>
              {storiesLoad ? (
                <div className="space-y-2 px-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}</div>
              ) : stories.length === 0 ? (
                <p className="text-xs text-surface-500 px-2">No stories yet</p>
              ) : stories.map((s: UserStory) => (
                <StoryRow key={s.id} story={s} expanded={expanded.has(s.id)}
                  onToggle={() => setExpanded((prev) => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                  tasks={allTasks.filter((t) => t.story === s.id)}
                  onNavigate={() => navigate(`/stories/${s.id}`)} />
              ))}
            </div>
            {(isAdmin || user?.role === 'member') && (
              <div className="p-3 border-t border-surface-200 dark:border-surface-800">
                <button onClick={() => setShowCreateStory(true)} className="btn-ghost w-full text-sm gap-2"><Plus className="w-4 h-4" />Add Story</button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-thin bg-surface-50 dark:bg-surface-900">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto scrollbar-thin p-4 md:p-6">
                {project?.is_archived && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-medium">
                    ⚠ This project is archived.
                  </div>
                )}
                {tasksLoad ? (
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, ci) => (
                      <div key={ci} className="space-y-3">
                        <Skeleton className="h-6 w-24 rounded-lg" />
                        {Array.from({ length: 3 }).map((__, j) => <KanbanCardSkeleton key={j} />)}
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 && !tasksLoad ? (
                  <EmptyState icon={<Plus className="w-6 h-6" />} title="No tasks yet" description="Create a task to get started" />
                ) : (
                  <KanbanBoard projectId={projectId} />
                )}
              </div>
            </div>
          </div>
        </main>

      
      <CreateStoryModal open={showCreateStory} onClose={() => setShowCreateStory(false)} projectId={projectId} />
      <CreateTaskModal open={showCreateTask} onClose={() => setShowCreateTask(false)} storyId={stories[0]?.id ?? 0} projectId={projectId} members={acceptedMemberUsers} />
    </div>
  );
}

function StoryRow({ story, expanded, onToggle, tasks, onNavigate }: { story: UserStory; expanded: boolean; onToggle: () => void; tasks: Task[]; onNavigate: () => void; }) {
  return (
    <div className="mb-0.5">
      <div className="flex items-center gap-1 px-1 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
        <button onClick={onToggle} className="p-0.5 shrink-0">
          <ChevronRight className={cn('w-3.5 h-3.5 text-surface-400 transition-transform', expanded && 'rotate-90')} />
        </button>
        <button onClick={onNavigate} className="flex-1 text-left text-sm truncate">{story.title}</button>
        <span className="text-[10px] text-surface-500 bg-surface-200 dark:bg-surface-700 px-1.5 rounded-full shrink-0">{story.task_count}</span>
      </div>
      {expanded && tasks.map((t) => (
        <p key={t.id} className="text-xs pl-8 pr-2 py-0.5 text-surface-500 truncate">{t.title}</p>
      ))}
    </div>
  );
}

function ProjectMembersPanel({ projectId, members, isAdmin }: { projectId: number, members: ProjectMember[] | undefined, isAdmin: boolean }) {
  const [tab, setTab] = useState<'team' | 'directory'>('team');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: allUsers } = useQuery({
    queryKey: ['users-directory', projectId, search],
    queryFn: async () => (await projectsApi.getUsersDirectory(projectId, search || undefined)).data,
    enabled: tab === 'directory' && isAdmin,
  });

  const changeRole = useChangeMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);

  const handleInvite = async (userId: number) => {
    try {
      await projectsApi.inviteMember(projectId, userId);
      toast.success('Invitation sent');
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filteredUsers = allUsers?.filter((u: User) =>
    !members?.find(m => m.user === u.id) &&
    (u.full_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {isAdmin && (
        <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg mb-4 shrink-0">
          <button onClick={() => setTab('team')} className={cn('flex-1 py-1 text-sm rounded-md font-medium', tab === 'team' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500')}>My Team</button>
          <button onClick={() => setTab('directory')} className={cn('flex-1 py-1 text-sm rounded-md font-medium', tab === 'directory' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500')}>User Directory</button>
        </div>
      )}

      {tab === 'team' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 hover:bg-surface-50 dark:hover:bg-surface-800/50 rounded-lg">
              <Avatar name={m.user_detail.full_name || m.user_detail.username} src={m.user_detail.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.user_detail.full_name || m.user_detail.username}</p>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", m.status === 'accepted' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
                    {m.status}
                  </span>
                  {!isAdmin && <span className="text-[10px] text-surface-500 capitalize">{m.role}</span>}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <select value={m.role} onChange={(e) => changeRole.mutate({ userId: m.user_detail.id, role: e.target.value })}
                    className="text-xs border border-surface-200 dark:border-surface-700 rounded px-1 py-1 bg-white dark:bg-surface-800">
                    <option value="admin">Admin</option><option value="member">Member</option><option value="viewer">Viewer</option>
                  </select>
                  <button onClick={() => removeMember.mutate(m.user_detail.id)} className="btn-ghost p-1 text-danger" title="Remove"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'directory' && isAdmin && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input-field pl-8 text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {filteredUsers?.map((u: User) => (
              <div key={u.id} className="flex items-center justify-between p-2 border border-surface-100 dark:border-surface-800 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={u.full_name || u.username} src={u.avatar_url} size="sm" />
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{u.full_name || u.username}</p>
                    <p className="text-[10px] text-surface-500 truncate">@{u.username}</p>
                  </div>
                </div>
                <button onClick={() => handleInvite(u.id)} className="btn-primary text-xs py-1 px-2 shrink-0">Invite</button>
              </div>
            ))}
            {filteredUsers?.length === 0 && <p className="text-sm text-surface-500 text-center py-4">No uninvited users found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="flex gap-6 p-6 -m-4 md:-m-6 lg:-m-8">
      <div className="w-64 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}</div>
      <div className="flex-1 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-24" />
            {Array.from({ length: 3 }).map((__, j) => <KanbanCardSkeleton key={j} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
