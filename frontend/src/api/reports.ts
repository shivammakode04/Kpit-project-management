import api from './client';

export const reportsApi = {
  exportProject: (id: number, format: 'csv' | 'pdf') =>
    api.get(`/projects/${id}/export/`, {
      params: { format },
      responseType: 'blob',
    }),
};
