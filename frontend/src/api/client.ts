import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const tokens = localStorage.getItem('flowforge_tokens');
  if (tokens) {
    const { access } = JSON.parse(tokens);
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = localStorage.getItem('flowforge_tokens');

      if (tokens) {
        try {
          const { refresh } = JSON.parse(tokens);
          const { data } = await axios.post('/api/auth/refresh/', { refresh });
          const newTokens = { access: data.access, refresh: data.refresh || refresh };
          localStorage.setItem('flowforge_tokens', JSON.stringify(newTokens));
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('flowforge_tokens');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
