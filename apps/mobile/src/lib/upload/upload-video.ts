import { apiClient } from "../api/client";
import { UploadError } from "../api/upload";

const isMock = process.env.EXPO_PUBLIC_MOCK_API === "true";

// Fallbacks for servers that predate these fields in the signature response.
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;
export const MAX_REEL_DURATION_MS = 60_000;

export type PickedVideo = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  /** Milliseconds, as reported by expo-image-picker. */
  duration?: number | null;
};

type VideoSignature = {
  api_key: string;
  timestamp: number;
  signature: string;
  cloud_name: string;
  folder: string;
  eager: string;
  eager_async: boolean;
  video_transformation?: string;
  poster_transformation?: string;
  max_bytes?: number;
};

type CloudinaryUpload = {
  secure_url: string;
  public_id: string;
  version: number;
  eager?: { secure_url?: string }[];
};

const toMb = (bytes: number) => Math.round(bytes / (1024 * 1024));

// fetch() can't report upload progress; XHR can, and a 30–90MB reel on mobile
// data needs a real progress bar.
function postWithProgress(
  url: string,
  body: FormData,
  onProgress?: (fraction: number) => void
): Promise<CloudinaryUpload> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total);
      };
    }
    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON body — handled below.
      }
      if (xhr.status >= 200 && xhr.status < 300 && json && !json.error) {
        resolve(json);
      } else {
        reject(new UploadError(json?.error?.message ?? "Video upload failed. Please try again."));
      }
    };
    xhr.onerror = () =>
      reject(
        new UploadError("Network error while uploading. Check your connection and try again.")
      );
    xhr.send(body);
  });
}

function extensionOf(video: PickedVideo) {
  const fromName = video.fileName?.match(/\.([a-z0-9]+)$/i)?.[1];
  const fromMime = video.mimeType?.split("/")[1]?.replace("quicktime", "mov");
  return (fromName ?? fromMime ?? "mp4").toLowerCase();
}

export async function uploadVideoToCloudinary(
  input: string | PickedVideo,
  options: { onProgress?: (fraction: number) => void } = {}
) {
  const video: PickedVideo = typeof input === "string" ? { uri: input } : input;

  if (isMock) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      videoUrl: "https://res.cloudinary.com/demo/video/upload/v1355998632/dog.mp4",
      thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/v1355998632/dog.jpg",
    };
  }

  if (video.duration && video.duration > MAX_REEL_DURATION_MS + 1000) {
    throw new UploadError(
      "Reels can be up to 60 seconds long. Please trim your video and try again."
    );
  }

  const { data: sig } = await apiClient.get<VideoSignature>("/upload/signature/video", {
    params: { folder: "reels" },
  });

  const maxBytes = sig.max_bytes ?? DEFAULT_MAX_BYTES;
  if (video.fileSize && video.fileSize > maxBytes) {
    throw new UploadError(
      `This video is ${toMb(video.fileSize)}MB. Please choose one under ${toMb(maxBytes)}MB or trim it.`
    );
  }

  const ext = extensionOf(video);
  const form = new FormData();
  form.append("file", {
    uri: video.uri,
    type: video.mimeType || "video/mp4",
    name: video.fileName || `reel.${ext}`,
  } as any);
  form.append("api_key", String(sig.api_key));
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("eager", sig.eager);
  form.append("eager_async", String(sig.eager_async));

  const json = await postWithProgress(
    `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`,
    form,
    options.onProgress
  );

  // Prefer the transcoded H.264 MP4 + poster the server asked Cloudinary to
  // pre-generate: the original may be a huge HEVC .mov some Androids can't play.
  const derived = (transformation: string | undefined, format: string, eagerIndex: number) =>
    json.eager?.[eagerIndex]?.secure_url ??
    (transformation
      ? `https://res.cloudinary.com/${sig.cloud_name}/video/upload/${transformation}/v${json.version}/${json.public_id}.${format}`
      : undefined);

  const videoUrl = derived(sig.video_transformation, "mp4", 0) ?? json.secure_url;
  const thumbnailUrl =
    derived(sig.poster_transformation, "jpg", 1) ??
    // Cloudinary auto-poster: same public_id with a .jpg extension.
    json.secure_url.replace(/\.[a-z0-9]+$/i, ".jpg");
  return { videoUrl, thumbnailUrl };
}
