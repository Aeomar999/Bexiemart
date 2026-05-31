import { createAuthClient } from "better-auth/client";
import { dashClient, sentinelNativeClient } from "@better-auth/infra/native";
import { ENV } from "../../config";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

// Fallback for web since SecureStore only works natively
const webStorage = new Map<string, string>();

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) return webStorage.get(key) || null;
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) webStorage.set(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
};

export const authClient = createAuthClient({
  baseURL: ENV.API_URL,
  plugins: [
    dashClient(),
    sentinelNativeClient({
      identifyUrl: process.env.EXPO_PUBLIC_BETTER_AUTH_KV_URL || "https://kv.better-auth.com",
      autoSolveChallenge: true,
      storage: storage,
    }),
  ],
});
