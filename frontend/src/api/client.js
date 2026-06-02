import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fb_token");
      try {
        const lang = localStorage.getItem("fb_lang") || "ru";
        const msg = lang === "kk" ? "Сессия аяқталды. Қайта кіріңіз." : lang === "en" ? "Session expired. Please log in again." : "Сессия истекла. Войдите снова.";
        sessionStorage.setItem("fb_toast", msg);
      } catch {}
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
