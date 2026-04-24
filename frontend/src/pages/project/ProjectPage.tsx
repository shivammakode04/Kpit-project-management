import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, ChevronRight, Archive, ArchiveRestore, Download, Search, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { projectsApi } from '@/api/projects';
import { storiesApi } from '@/api/stories';
import { tasksApi } from '@/api/tasks';
import { useProjectMembers, useArchiveProject, useAddMember, useRemoveMember, useChangeMemberRole } from '@/hooks/useProjects';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import CreateStoryModal from '@/components/modals/CreateStoryModal';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import { Skeleton, KanbanCardSkeleton } from '@/components/ui/Skeleton';
import { cn, triggerDownload, getErrorMessage, getBookmarks, toggleBookmark } from '@/lib/utils';
import type { Task, UserStory, Status, Priority } from '@/types';

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
  const [showMembers, setShowMembers] = useState(false);
  const [filters, setFilters] = useState<Filters>({ search: '', priority: '', assignee: '', starred: false });
  const [bookmarks, setBookmarks] = useState<number[]>(() => getBookmarks(user?.id));

  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'admin' || user?.role === 'editor';

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
  const storyKey = stories.map((s) => s.id).join(',');
  const { data: allTasksRaw, isLoading: tasksLoad } = useQuery({
    queryKey: ['project-tasks', projectId, storyKey],
    queryFn: async () => {
      if (!stories.length) return [];
      const res = await Promise.all(stories.map(async (s) => (await tasksApi.list(s.id)).data.results));
      return res.flat();
    },
    enabled: stories.length > 0,
    refetchInterval: 60_000,
  });
  const { data: members } = useProjectMembers(projectId);
  const archiveMutation = useArchiveProject();
  const addMember = useAddMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const changeRole = useChangeMemberRole(projectId);
  const memberUsers = members?.map((m) => m.user_detail) ?? [];
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

  const handleExport = async (fmt: 'csv' | 'pdf') => {
    try {
      const { data } = await (fmt === 'csv' ? projectsApi.exportCsv(projectId) : projectsApi.exportPdf(projectId));
      triggerDownload(data as Blob, `project-${projectId}.${fmt}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (projLoad) return <ProjectSkeleton />;

  return (
    <div className="-m-4 md:-m-6 lg:-m-8 flex h-[calc(100vh-4rem)] overflow-hidden">
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
              ) : stories.map((s) => (
                <StoryRow key={s.id} story={s} expanded={expanded.has(s.id)}
                  onToggle={() => setExpanded((prev) => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                  tasks={allTasks.filter((t) => t.story === s.id)}
                  onNavigate={() => navigate(`/stories/${s.id}`)} />
              ))}
            </div>
            {isEditor && (
              <div className="p-3 border-t border-surface-200 dark:border-surface-800">
                <button onClick={() => setShowCreateStory(true)} className="btn-ghost w-full text-sm gap-2"><Plus className="w-4 h-4" />Add Story</button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-surface-200 dark:border-surface-800 shrink-0 bg-white dark:bg-surface-900">
          <button onClick={() => setPanelOpen(!panelOpen)} className="btn-ghost p-1.5">
            <ChevronRight className={cn('w-4 h-4 transition-transform', panelOpen && 'rotate-180')} />
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
            <input value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search tasks..." className="input-field pl-8 py-1.5 text-sm w-40" />
          </div>
          <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value as Priority | '' }))} className="input-field py-1.5 text-sm w-32">
            <option value="">All priorities</option>
            <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select value={filters.assignee} onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))} className="input-field py-1.5 text-sm w-36">
            <option value="">All members</option>
            {memberUsers.map((m) => <option key={m.id} value={String(m.id)}>{m.full_name || m.username}</option>)}
          </select>
          <button onClick={() => setFilters((f) => ({ ...f, starred: !f.starred }))} className={cn('btn-ghost p-1.5', filters.starred && 'text-amber-500')} title="Starred">
            <Star className={cn('w-4 h-4', filters.starred && 'fill-amber-500')} />
          </button>
          {(filters.search || filters.priority || filters.assignee || filters.starred) && (
            <button onClick={() => setFilters({ search: '', priority: '', assignee: '', starred: false })} className="btn-ghost p-1.5 text-danger"><X className="w-4 h-4" /></button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isEditor && (
              <button onClick={() => { setShowCreateTask(true); }} className="btn-primary text-sm py-1.5"><Plus className="w-3.5 h-3.5" />Task</button>
            )}
            {isEditor && (
              <div className="relative group">
                <button className="btn-secondary text-sm py-1.5"><Download className="w-3.5 h-3.5" />Export</button>
                <div className="absolute right-0 top-full mt-1 w-28 glass-card shadow-lg py-1 hidden group-hover:block z-20">
                  <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-100 dark:hover:bg-surface-800">CSV</button>
                  <button onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-100 dark:hover:bg-surface-800">PDF</button>
                </div>
              </div>
            )}
            <button onClick={() => setShowMembers(!showMembers)} className="btn-ghost p-1.5 relative">
              <Users className="w-4 h-4" />
              {members && members.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{members.length}</span>
              )}
            </button>
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
            <KanbanBoard tasks={filtered} bookmarks={bookmarks}
              onStatusChange={handleStatusChange}
              onTaskClick={(t) => navigate(`/stories/${t.story}`)}
              onBookmark={(tid) => setBookmarks(toggleBookmark(tid, user?.id))}
              readonly={!isEditor || !!project?.is_archived} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showMembers && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setShowMembers(false)} />
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed right-4 top-20 w-80 glass-card shadow-xl z-50 p-4">
              <h3 className="font-semibold mb-3">Team Members ({members?.length ?? 0})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {members?.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar name={m.user_detail.full_name || m.user_detail.username} src={m.user_detail.avatar_url} size="sm" />
                    <p className="text-sm flex-1 truncate">{m.user_detail.full_name || m.user_detail.username}</p>
                    {isAdmin ? (
                      <select value={m.role} onChange={(e) => changeRole.mutate({ userId: m.user_detail.id, role: e.target.value })}
                        className="text-xs border border-surface-200 dark:border-surface-700 rounded px-1 py-0.5 bg-white dark:bg-surface-800">
                        <option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option>
                      </select>
                    ) : <span className="text-xs text-surface-500 capitalize">{m.role}</span>}
                    {isAdmin && <button onClick={() => removeMember.mutate(m.user_detail.id)} className="btn-ghost p-1 text-danger"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <AddMemberRow onAdd={(uid, role) => addMember.mutate({ user_id: uid, role })} />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreateStoryModal open={showCreateStory} onClose={() => setShowCreateStory(false)} projectId={projectId} />
      <CreateTaskModal open={showCreateTask} onClose={() => setShowCreateTask(false)} storyId={stories[0]?.id ?? 0} members={memberUsers} />
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

function AddMemberRow({ onAdd }: { onAdd: (uid: number, role: string) => void }) {
  const [uid, setUid] = useState('');
  const [role, setRole] = useState('editor');
  return (
    <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 flex gap-2">
      <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="User ID" className="input-field py-1 text-xs flex-1" />
      <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field py-1 text-xs w-20">
        <option value="editor">Editor</option><option value="viewer">Viewer</option><option value="admin">Admin</option>
      </select>
      <button onClick={() => { if (uid) { onAdd(Number(uid), role); setUid(''); } }} className="btn-primary py-1 px-2 text-xs">Add</button>
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
