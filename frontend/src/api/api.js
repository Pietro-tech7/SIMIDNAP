import axios from 'axios';

// Em produção (Vercel), usa a variável VITE_API_URL.
// Em desenvolvimento, cai no localhost.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor que adiciona o token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta — renovação automática do token
let refreshing = false;
let filaDeEspera = [];

const processarFila = (novoToken) => {
  filaDeEspera.forEach((callback) => callback(novoToken));
  filaDeEspera = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register')
    ) {
      originalRequest._retry = true;

      if (refreshing) {
        return new Promise((resolve) => {
          filaDeEspera.push((novoToken) => {
            originalRequest.headers.Authorization = `Bearer ${novoToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      refreshing = true;

      try {
        const refreshURL = `${baseURL}/auth/refresh`;
        const res = await axios.post(refreshURL, {}, { withCredentials: true });

        const novoToken = res.data.access_token;
        localStorage.setItem('access_token', novoToken);

        originalRequest.headers.Authorization = `Bearer ${novoToken}`;
        processarFila(novoToken);
        refreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        refreshing = false;
        filaDeEspera = [];
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;