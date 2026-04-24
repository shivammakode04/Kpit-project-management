import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectsApi } from '@/api/projects';
import { getErrorMessage } from '@/lib/utils';
import type { Project, ProjectMember } from '@/types';

export function useProjects(page = 1) {
  return useQuery({
    queryKey: ['projects', page],
    queryFn: async () => {
      const { data } = await projectsApi.list(page);
      return data;
    },
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await projectsApi.get(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useProjectMembers(projectId: number) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const { data } = await projectsApi.getMembers(projectId);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useProjectActivity(projectId: number, page = 1) {
  return useQuery({
    queryKey: ['project-activity', projectId, page],
    queryFn: async () => {
      const { data } = await projectsApi.getActivity(projectId, page);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      projectsApi.create(data).then((r) => r.data),
    onSuccess: (project: Project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project "${project.name}" created!`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; description?: string }) =>
      projectsApi.update(id, data).then((r) => r.data),
    onSuccess: (project: Project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', project.id] });
      toast.success('Project updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsApi.archive(id).then((r) => r.data),
    onSuccess: (project: Project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', project.id] });
      toast.success(project.is_archived ? 'Project archived' : 'Project restored');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useAddMember(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: number; role: string }) =>
      projectsApi.addMember(projectId, data).then((r) => r.data),
    onSuccess: (_: ProjectMember) => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Member added');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useRemoveMember(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Member removed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useChangeMemberRole(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      projectsApi.changeMemberRole(projectId, userId, role).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Role updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
