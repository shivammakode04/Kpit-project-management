export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner: number;
  owner_name: string;
  is_archived: boolean;
  member_count: number;
  created_at: string;
}

export interface ProjectMember {
  id: number;
  project: number;
  user: number;
  user_detail: User;
  role: 'admin' | 'editor' | 'viewer';
  joined_at: string;
}

export interface UserStory {
  id: number;
  project: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  created_by: number;
  created_by_name: string;
  task_count: number;
  created_at: string;
}

export interface Task {
  id: number;
  story: number;
  story_title: string;
  project_id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to: number | null;
  assigned_to_name: string | null;
  due_date: string | null;
  created_by: number;
  created_by_name: string;
  comment_count: number;
  attachment_count: number;
  created_at: string;
}

export interface Comment {
  id: number;
  task: number;
  user: number;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user: number;
  user_name: string;
  project: number;
  action: string;
  target_type: string;
  target_id: number;
  created_at: string;
}

export interface BackgroundJob {
  id: number;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  payload: string | null;
  result: string | null;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  scheduled_at: string;
  executed_at: string | null;
  created_at: string;
}

export interface TaskAttachment {
  id: number;
  task: number;
  file: string;
  filename: string;
  file_size: number;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface SearchResults {
  projects: Project[];
  stories: UserStory[];
  tasks: Task[];
}

export type Status = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';
