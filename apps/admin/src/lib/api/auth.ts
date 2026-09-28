import { apiClient } from "./client";

export const login = async (credentials: { email: string; password: string }) => {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data; // { user } or { requiresTwoFactor: true }
};

export const getMe = async () => {
  const { data } = await apiClient.get("/users/me");
  return data;
};

export const updateProfile = async (payload: { name?: string; image?: string }) => {
  const { data } = await apiClient.patch("/users/profile", payload);
  return data;
};

export const updatePassword = async (payload: {
  currentPassword?: string;
  newPassword?: string;
}) => {
  const { data } = await apiClient.post("/auth/change-password", {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
    revokeOtherSessions: true,
  });
  return data;
};

// Mirrors the server's POST /upload limits so admins get an instant, specific
// message instead of a round-trip and a generic failure.
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp,image/heic,image/heif";
const ACCEPTED_TYPES = UPLOAD_ACCEPT.split(",");

/** An upload failure whose message is safe to show to the admin as-is. */
export class UploadError extends Error {}

export const uploadFile = async (file: File) => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new UploadError("Unsupported image type. Use JPG, PNG, WebP or HEIC.");
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    throw new UploadError("Image is too large. Maximum size is 10MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  try {
    // axios drops this for FormData in the browser so the boundary is set.
    const { data } = await apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as { url: string; public_id: string; filename: string };
  } catch (error: any) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;
    if (status === 413) throw new UploadError("Image is too large. Maximum size is 10MB.");
    if (status === 400 && typeof message === "string") throw new UploadError(message);
    throw error;
  }
};
