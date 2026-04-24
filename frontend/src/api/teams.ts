import api from './client';
import type { User, ProjectMember } from '@/types';

export const teamsApi = {
  // Get all users for inviting (excluding current project members)
  getAllUsers: (projectId: number, query?: string) =>
    api.get<User[]>(`/projects/${projectId}/users-directory/`, { 
      params: query ? { q: query } : {} 
    }),

  // Get project team members (accepted only)
  getTeamMembers: (projectId: number) =>
    api.get<ProjectMember[]>(`/projects/${projectId}/members/`, { 
      params: { status: 'accepted' } 
    }),

  // Send invitation to user
  inviteUser: (projectId: number, userId: number) =>
    api.post(`/projects/${projectId}/invite/`, { user_id: userId }),

  // Accept invitation
  acceptInvite: (memberId: number) =>
    api.post(`/projects/invites/${memberId}/accept/`),
};