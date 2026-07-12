import axios from "axios";
import { useAuthStore } from "../stores/auth-store";

// All REST traffic goes through the same-origin proxy; the httpOnly session
// cookie rides along automatically and the proxy attaches the Bearer header
// server-side. Page JS never sees the token.
export const apiClient = axios.create({
  baseURL: "/api/proxy",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      await fetch("/api/session", { method: "DELETE" }).catch(() => {});
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
