import api from './client';
import type { SearchResults, BackgroundJob, PaginatedResponse } from '@/types';

export const searchApi = {
  search: (params: Record<string, string>) =>
    api.get<SearchResults>('/search/', { params }),
};

export const jobsApi = {
  list: (page = 1) =>
    api.get<PaginatedResponse<BackgroundJob>>('/jobs/', { params: { page } }),

  trigger: (jobType: string) =>
    api.post('/jobs/trigger/', { job_type: jobType }),
};
