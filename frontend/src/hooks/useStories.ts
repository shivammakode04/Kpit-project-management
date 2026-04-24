import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { storiesApi } from '@/api/stories';
import { getErrorMessage } from '@/lib/utils';
import type { UserStory } from '@/types';

export function useStories(projectId: number, page = 1) {
  return useQuery({
    queryKey: ['stories', projectId, page],
    queryFn: async () => {
      const { data } = await storiesApi.list(projectId, page);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useStory(id: number) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: async () => {
      const { data } = await storiesApi.get(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateStory(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; priority?: string }) =>
      storiesApi.create(projectId, data).then((r) => r.data),
    onSuccess: (story: UserStory) => {
      qc.invalidateQueries({ queryKey: ['stories', projectId] });
      toast.success(`Story "${story.title}" created!`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: number } & Partial<Pick<UserStory, 'title' | 'description' | 'status' | 'priority'>>) =>
      storiesApi.update(id, data).then((r) => r.data),
    onSuccess: (story: UserStory) => {
      qc.invalidateQueries({ queryKey: ['stories', story.project] });
      qc.invalidateQueries({ queryKey: ['story', story.id] });
      toast.success('Story updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteStory(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => storiesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories', projectId] });
      toast.success('Story deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
