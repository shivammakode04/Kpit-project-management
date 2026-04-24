import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '@/api/tasks';
import { getErrorMessage } from '@/lib/utils';
import type { Task } from '@/types';

export function useTasks(
  storyId: number,
  params?: Record<string, string>,
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: ['tasks', storyId, params],
    queryFn: async () => {
      const { data } = await tasksApi.list(storyId, params);
      return data;
    },
    enabled: !!storyId,
    refetchInterval: options?.refetchInterval,
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data } = await tasksApi.get(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useComments(taskId: number) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data } = await tasksApi.getComments(taskId);
      return data;
    },
    enabled: !!taskId,
  });
}

export function useAttachments(taskId: number) {
  return useQuery({
    queryKey: ['attachments', taskId],
    queryFn: async () => {
      const { data } = await tasksApi.getAttachments(taskId);
      return data;
    },
    enabled: !!taskId,
  });
}

export function useCreateTask(storyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      priority?: string;
      assigned_to?: number | null;
      due_date?: string | null;
    }) => {
      // Convert assigned_to to array format for backend
      const payload = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        assigned_to: data.assigned_to ? [data.assigned_to] : [],
        due_date: data.due_date
      };
      return tasksApi.create(storyId, payload).then((r) => r.data);
    },
    onSuccess: (task: Task) => {
      qc.invalidateQueries({ queryKey: ['tasks', storyId] });
      qc.invalidateQueries({ queryKey: ['stories'] });
      toast.success(`Task "${task.title}" created!`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateTask(storyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: number } & Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date'>>) =>
      tasksApi.update(id, data).then((r) => r.data),
    onSuccess: (task: Task) => {
      qc.invalidateQueries({ queryKey: ['tasks', storyId] });
      qc.invalidateQueries({ queryKey: ['task', task.id] });
      toast.success('Task updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateTaskStatus(storyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      tasksApi.updateStatus(id, status).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', storyId] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteTask(storyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', storyId] });
      qc.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Task deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useAddComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => tasksApi.addComment(taskId, content).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => tasksApi.deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Comment deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUploadAttachment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => tasksApi.uploadAttachment(taskId, file).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', taskId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('File uploaded');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
