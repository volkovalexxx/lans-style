import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  paramsSerializer: {
    serialize: (params: Record<string, any>) => {
      const sp = new URLSearchParams();
      for (const [key, val] of Object.entries(params)) {
        if (val === undefined || val === null) continue;
        if (Array.isArray(val)) {
          val.forEach((v) => sp.append(key, String(v)));
        } else {
          sp.append(key, String(val));
        }
      }
      return sp.toString();
    },
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
    }
    return Promise.reject(err);
  }
);

export default api;
