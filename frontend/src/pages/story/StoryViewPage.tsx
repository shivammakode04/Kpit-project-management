import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Paperclip, MessageSquare, Clock, BookOpen, ChevronLeft, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { storiesApi } from '@/api/stories';
import { tasksApi } from '@/api/tasks';
import { projectsApi } from '@/api/projects';
import { useUpdateStory } from '@/hooks/useStories';
import { useTasks, useUpdateTaskStatus, useDeleteTask, useAddComment, useDeleteComment, useUploadAttachment } from '@/hooks/useTasks';
import { cn, timeAgo, formatDate, isOverdue, isDueToday, formatFileSize, getErrorMessage } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import PriorityBadge from '@/components/common/PriorityBadge';
import StatusChip from '@/components/common/StatusChip';
import EmptyState from '@/components/common/EmptyState';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import { Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import type { Task, Comment, TaskAttachment, Status } from '@/types';

const STATUS_CYCLE: Status[] = ['todo', 'in_progress', 'done'];

export default function StoryViewPage() {
  const { id } = useParams<{ id: string }>();
  const storyId = Number(id);
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'tasks' | 'comments' | 'activity'>('tasks');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const isEditor = user?.role === 'admin' || user?.role === 'member';

  const { data: story, isLoading: storyLoad } = useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => (await storiesApi.get(storyId)).data,
    enabled: !!storyId,
  });

  const { data: tasksData, isLoading: tasksLoad } = useTasks(storyId);
  const tasks = tasksData?.results ?? [];

  const { data: membersData } = useQuery({
    queryKey: ['project-members', story?.project, 'accepted'],
    queryFn: async () => (await projectsApi.getMembers(story!.project, 'accepted')).data,
    enabled: !!story?.project,
  });
  const members = membersData?.map((m) => m.user_detail) ?? [];

  const { data: activityData } = useQuery({
    queryKey: ['project-activity', story?.project, 1],
    queryFn: async () => (await projectsApi.getActivity(story!.project, 1)).data,
    enabled: !!story?.project,
  });

  const updateStory = useUpdateStory();
  const updateStatus = useUpdateTaskStatus(storyId);
  const deleteTask = useDeleteTask(storyId);

  const handleCycleStatus = (task: Task) => {
    const idx = STATUS_CYCLE.indexOf(task.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    updateStatus.mutate({ id: task.id, status: next });
    toast.info(`Status → ${next.replace('_', ' ')}`);
  };

  const handleSaveTitle = () => {
    if (!titleDraft.trim() || !story) return;
    updateStory.mutate({ id: story.id, title: titleDraft });
    setEditingTitle(false);
  };

  // Task stats
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const taskProgress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  if (storyLoad) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <TableRowSkeleton rows={4} />
    </div>
  );

  if (!story) return <div className="p-8 text-center text-surface-500">Story not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        to={`/projects/${story.project}`}
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-brand-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to project
      </Link>

      {/* Story Header */}
      <div className="glass-card p-6 gradient-card">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  className="input-field text-lg font-bold flex-1"
                  autoFocus
                />
                <button onClick={handleSaveTitle} className="btn-primary p-2"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingTitle(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <h1
                className={cn('text-xl font-bold', isEditor && 'cursor-pointer hover:text-brand-600 transition-colors group')}
                onClick={() => { if (isEditor) { setTitleDraft(story.title); setEditingTitle(true); } }}
              >
                {story.title}
                {isEditor && <Edit2 className="w-3.5 h-3.5 inline ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </h1>
            )}
            {story.description && <p className="text-surface-500 text-sm mt-2 leading-relaxed">{story.description}</p>}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <PriorityBadge priority={story.priority} />
              <StatusChip status={story.status} />
              <span className="text-xs text-surface-400">Created by {story.created_by_name}</span>
              <span className="text-xs text-surface-400">·</span>
              <span className="text-xs text-surface-400">{timeAgo(story.created_at)}</span>
            </div>

            {/* Progress bar */}
            {tasks.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${taskProgress}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>
                <span className="text-xs font-semibold text-surface-500">{doneTasks}/{tasks.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {([
          { key: 'tasks' as const, label: 'Tasks', count: tasks.length },
          { key: 'comments' as const, label: 'Comments' },
          { key: 'activity' as const, label: 'Activity' },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2',
            tab === t.key ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500 hover:text-surface-700',
          )}>
            {t.label}
            {t.count !== undefined && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                tab === t.key ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="space-y-3">
          {isEditor && (
            <button onClick={() => setShowCreateTask(true)} className="btn-primary w-full justify-center">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
          {tasksLoad ? <TableRowSkeleton /> : tasks.length === 0 ? (
            <EmptyState icon={<Plus className="w-6 h-6" />} title="No tasks yet" description="Break this story into tasks" />
          ) : tasks.map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              index={i}
              isEditor={isEditor}
              currentUserId={user?.id}
              onCycleStatus={() => handleCycleStatus(task)}
              onDelete={() => setDeleteTaskId(task.id)}
              onExpand={() => setActiveTaskId(activeTaskId === task.id ? null : task.id)}
              expanded={activeTaskId === task.id}
              storyId={storyId}
            />
          ))}
        </div>
      )}

      {/* Comments Tab */}
      {tab === 'comments' && activeTaskId && (
        <CommentsPanel taskId={activeTaskId} currentUserId={user?.id} />
      )}
      {tab === 'comments' && !activeTaskId && (
        <EmptyState title="Select a task" description="Expand a task from the Tasks tab to see its comments" />
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <div className="space-y-2">
          {activityData?.results.length === 0 ? (
            <EmptyState icon={<Clock className="w-6 h-6" />} title="No activity yet" />
          ) : activityData?.results.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 glass-card p-3"
            >
              <Avatar name={log.user_name} size="sm" />
              <div>
                <p className="text-sm"><span className="font-medium">{log.user_name}</span> {log.action}</p>
                <p className="text-xs text-surface-400">{timeAgo(log.created_at)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <CreateTaskModal open={showCreateTask} onClose={() => setShowCreateTask(false)} storyId={storyId} members={members} />
      <ConfirmDeleteModal
        open={deleteTaskId !== null}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={() => { if (deleteTaskId) { deleteTask.mutate(deleteTaskId); setDeleteTaskId(null); } }}
        title="Delete Task"
        description="This task and all its comments will be permanently deleted."
        isPending={deleteTask.isPending}
      />
    </div>
  );
}

function TaskRow({ task, index, isEditor, currentUserId: _, onCycleStatus, onDelete, onExpand, expanded, storyId }: {
  task: Task; index: number; isEditor: boolean; currentUserId?: number; onCycleStatus: () => void;
  onDelete: () => void; onExpand: () => void; expanded: boolean; storyId: number;
}) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done';
  const dueToday = isDueToday(task.due_date) && task.status !== 'done';
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadAttachment = useUploadAttachment(task.id);
  const { data: attachments } = useQuery({
    queryKey: ['attachments', task.id],
    queryFn: async () => (await tasksApi.getAttachments(task.id)).data,
    enabled: expanded,
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    uploadAttachment.mutate(file);
    e.target.value = '';
  };

  const assignees = task.assigned_to_details || task.assigned_to_names?.map((name, i) => ({
    id: i, username: name, full_name: name, avatar_url: null,
  })) || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card overflow-hidden"
    >
      <div className="flex items-start gap-3 p-4">
        <StatusChip status={task.status} onClick={isEditor ? onCycleStatus : undefined} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{task.title}</p>
          {task.description && (
            <p className="text-xs text-surface-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <PriorityBadge priority={task.priority} />
            {task.due_date && (
              <span className={cn('text-xs flex items-center gap-1 px-2 py-0.5 rounded-full',
                overdue ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-medium' :
                dueToday ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                'bg-surface-100 text-surface-500 dark:bg-surface-800')}>
                {formatDate(task.due_date)}
              </span>
            )}
            <span className="text-xs text-surface-400">by {task.created_by_name}</span>
          </div>
          
          {/* Assigned users */}
          {assignees.length > 0 && (
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-[10px] text-surface-400 font-medium uppercase tracking-wider">Assigned</span>
              <div className="flex -space-x-1.5">
                {assignees.slice(0, 4).map((u) => (
                  <div key={u.id} title={u.full_name || u.username} className="ring-2 ring-white dark:ring-surface-900">
                    <Avatar name={u.full_name || u.username} src={u.avatar_url || undefined} size="xs" />
                  </div>
                ))}
                {assignees.length > 4 && (
                  <span className="text-[10px] text-surface-500 ml-2">+{assignees.length - 4} more</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onExpand} className={cn(
            'btn-ghost p-1.5 text-xs flex items-center gap-1',
            expanded && 'bg-brand-50 text-brand-600 dark:bg-brand-900/20',
          )}>
            <MessageSquare className="w-3.5 h-3.5" />{task.comment_count}
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost p-1.5 text-xs flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5" />{task.attachment_count}
          </button>
          {isEditor && (
            <button onClick={onDelete} className="btn-ghost p-1.5 text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
          )}
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-surface-100 dark:border-surface-800 px-4 pb-4 pt-3 space-y-3">
              <CommentsPanel taskId={task.id} currentUserId={undefined} />
              {attachments && attachments.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-surface-500 mb-2 uppercase tracking-wider">Attachments</p>
                  <div className="space-y-1">
                    {(attachments as TaskAttachment[]).map((a) => (
                      <a key={a.id} href={a.file} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-brand-600 hover:underline p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors">
                        <Paperclip className="w-3 h-3" />{a.filename} ({formatFileSize(a.file_size)})
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CommentsPanel({ taskId, currentUserId }: { taskId: number; currentUserId?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => (await tasksApi.getComments(taskId)).data,
    enabled: !!taskId,
  });
  const addComment = useAddComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const { register, handleSubmit, reset } = useForm<{ content: string }>();
  const comments: Comment[] = data?.results ?? [];

  const onSubmit = async ({ content }: { content: string }) => {
    if (!content.trim()) return;
    await addComment.mutateAsync(content);
    reset();
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Comments</p>
      {isLoading ? <Skeleton className="h-10 w-full" /> : comments.length === 0 ? (
        <p className="text-xs text-surface-400 italic">No comments yet</p>
      ) : comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2.5">
          <Avatar name={c.user_name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="bg-surface-50 dark:bg-surface-800 rounded-xl px-3.5 py-2.5">
              <p className="text-xs font-semibold">{c.user_name}</p>
              <p className="text-sm mt-0.5 leading-relaxed">{c.content}</p>
            </div>
            <p className="text-[10px] text-surface-400 mt-1 ml-1">{timeAgo(c.created_at)}</p>
          </div>
          {(c.user === currentUserId) && (
            <button onClick={() => deleteComment.mutate(c.id)} className="btn-ghost p-1 text-danger shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <input {...register('content')} placeholder="Add a comment..." className="input-field text-sm flex-1 py-2" />
        <button type="submit" disabled={addComment.isPending} className="btn-primary py-2 px-3 text-sm">
          <Send className="w-3.5 h-3.5" />
          Post
        </button>
      </form>
    </div>
  );
}
