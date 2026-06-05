import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb) localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

import { ENV } from "../../config";

const API_URL = ENV.API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getItem("bexiemart_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

import { useAuthStore } from "../stores/auth-store";

import { z } from "zod";
import * as Sentry from "@sentry/react-native";

declare module "axios" {
  export interface AxiosRequestConfig {
    zodSchema?: z.ZodType<any>;
  }
}

apiClient.interceptors.response.use(
  (response) => {
    const schema = (response.config as any).zodSchema;
    if (schema) {
      const parsed = schema.safeParse(response.data);
      if (!parsed.success) {
        console.error("API Contract Violation:", parsed.error);
        Sentry.captureException(new Error("API Contract Violation"), {
          extra: { issues: parsed.error.issues, url: response.config.url },
        });
        // You could optionally throw here to fail hard, but returning data
        // might allow the app to partially work if the schema mismatch is minor.
      } else {
        response.data = parsed.data;
      }
    }
    return response;
  },
  async (error) => {
    // Extract user-friendly error message from backend
    if (error.response?.data?.message) {
      const backendMessage = error.response.data.message;
      error.message = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
    } else if (error.message === "Network Error") {
      error.message = "Unable to connect to the server. Please check your internet connection.";
    }

    if (error.response?.status === 401) {
      // Not just removing from storage, but updating app state to trigger redirect
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export { apiClient };
