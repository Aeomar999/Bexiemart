import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ENV } from "../../config";
import { prepareImageForUpload, type UploadableFile } from "../upload/prepare-image";

const isWeb = Platform.OS === "web";
const isMock = process.env.EXPO_PUBLIC_MOCK_API === "true";

const getToken = async () => {
  if (isWeb) return localStorage.getItem("bexiemart_token");
  return await SecureStore.getItemAsync("bexiemart_token");
};

const API_URL = ENV.API_URL;

export type UploadResponse = { url: string; public_id?: string; filename?: string };

/** An upload failure whose message is safe to show to the user as-is. */
export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  // multer aborts oversized bodies with a bare "File too large".
  if (res.status === 413) return "That file is too large. Please choose a smaller one.";
  if (res.status === 401) return "Your session has expired. Please log in again.";
  if (res.status >= 500) return fallback;
  try {
    const body = await res.json();
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    if (typeof message === "string" && message) return message;
  } catch {
    // Non-JSON error body — fall through.
  }
  return fallback;
}

async function postFile(
  path: string,
  file: UploadableFile,
  fallbackError: string
): Promise<UploadResponse> {
  const formData = new FormData();
  if (isWeb) {
    // Browsers need a real Blob; picked and processed images are blob:/data: URIs.
    const blob = file.file ?? (await (await fetch(file.uri)).blob());
    formData.append("file", blob, file.name);
  } else {
    formData.append("file", { uri: file.uri, name: file.name, type: file.type } as any);
  }

  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new UploadError(
      "Unable to connect to the server. Please check your internet connection."
    );
  }

  if (!res.ok) throw new UploadError(await readErrorMessage(res, fallbackError));
  return res.json() as Promise<UploadResponse>;
}

const mockUpload = async (): Promise<UploadResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    filename: `mock-${Date.now()}`,
  };
};

export const uploadApi = {
  /** Upload an image (photo, logo, banner, product shot, chat image). */
  uploadFile: async (file: UploadableFile): Promise<UploadResponse> => {
    if (isMock) return mockUpload();
    const prepared = await prepareImageForUpload(file);
    return postFile("/upload", prepared, "Upload failed. Please try again.");
  },

  /** Upload a business document: a PDF, or a photo/scan of one. */
  uploadDocument: async (file: UploadableFile): Promise<UploadResponse> => {
    if (isMock) return mockUpload();
    const prepared = file.type === "application/pdf" ? file : await prepareImageForUpload(file);
    return postFile("/upload/document", prepared, "Document upload failed. Please try again.");
  },
};

/** User-facing message for an upload failure. */
export function uploadErrorMessage(error: unknown, fallback: string): string {
  return error instanceof UploadError ? error.message : fallback;
}
