import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ENV } from "../../config";

const isWeb = Platform.OS === "web";
const isMock = process.env.EXPO_PUBLIC_MOCK_API === "true";

const getToken = async () => {
  if (isWeb) return localStorage.getItem("bexiemart_token");
  return await SecureStore.getItemAsync("bexiemart_token");
};

const API_URL = ENV.API_URL;

export const uploadApi = {
  uploadFile: async (file: { uri: string; name: string; type: string; file?: any }) => {
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        filename: `mock-${Date.now()}`,
      };
    }

    const formData = new FormData();
    if (isWeb && file.file) {
      formData.append("file", file.file);
    } else {
      formData.append("file", { uri: file.uri, name: file.name, type: file.type } as any);
    }

    const token = await getToken();
    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");
    return res.json() as Promise<{ url: string; filename: string }>;
  },
};
