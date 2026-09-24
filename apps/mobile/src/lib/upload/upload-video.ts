import { apiClient } from "../api/client";
import { Platform } from "react-native";

const isMock = process.env.EXPO_PUBLIC_MOCK_API === "true";

export async function uploadVideoToCloudinary(localUri: string) {
  if (isMock) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      videoUrl: "https://res.cloudinary.com/demo/video/upload/v1355998632/dog.mp4",
      thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/v1355998632/dog.jpg",
    };
  }

  const { data: sig } = await apiClient.get("/upload/signature/video", {
    params: { folder: "reels" },
  });

  const form = new FormData();
  form.append("file", { uri: localUri, type: "video/mp4", name: "reel.mp4" } as any);
  form.append("api_key", String(sig.api_key));
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("eager", sig.eager);
  form.append("eager_async", String(sig.eager_async));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json?.error?.message ?? "Video upload failed");

  // Cloudinary auto-poster: swap the video extension for .jpg on the same public_id.
  const videoUrl: string = json.secure_url;
  const thumbnailUrl = videoUrl.replace(/\.(mp4|mov|webm)$/i, ".jpg");
  return { videoUrl, thumbnailUrl };
}
