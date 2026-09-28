import { uploadVideoToCloudinary } from "./upload-video";
import { apiClient } from "../api/client";

jest.mock("../api/client", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));
jest.mock("../upload/prepare-image", () => ({ prepareImageForUpload: jest.fn() }));

// React Native's FormData keeps {uri, name, type} file parts as objects; the
// jest environment's stringifies them, so record appends instead.
class RecordingFormData {
  private entries = new Map<string, unknown>();
  append(key: string, value: unknown) {
    this.entries.set(key, value);
  }
  get(key: string) {
    return this.entries.has(key) ? this.entries.get(key) : null;
  }
}
(global as any).FormData = RecordingFormData;

const SIGNATURE = {
  api_key: "key-123",
  timestamp: 123456789,
  signature: "sig-abc",
  folder: "reels",
  eager: "c_limit,h_1280,w_720,q_auto,vc_h264/mp4|so_0,c_limit,h_1280,w_720,q_auto/jpg",
  eager_async: true,
  cloud_name: "test-cloud",
  video_transformation: "c_limit,h_1280,w_720,q_auto,vc_h264",
  poster_transformation: "so_0,c_limit,h_1280,w_720,q_auto",
  max_bytes: 100 * 1024 * 1024,
};

// Minimal XMLHttpRequest stand-in: records the request and lets each test
// decide how the upload ends.
class FakeXhr {
  static last: FakeXhr | undefined;
  static respond: (xhr: FakeXhr) => void = () => {};
  method = "";
  url = "";
  body: any;
  status = 0;
  responseText = "";
  upload: { onprogress?: (e: any) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: any) {
    this.body = body;
    FakeXhr.last = this;
    FakeXhr.respond(this);
  }
}

const reply = (status: number, body: unknown) => (xhr: FakeXhr) => {
  xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
  xhr.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
  xhr.status = status;
  xhr.responseText = JSON.stringify(body);
  xhr.onload?.();
};

const UPLOADED = {
  secure_url: "https://res.cloudinary.com/test-cloud/video/upload/v1234/reels/clip.mov",
  public_id: "reels/clip",
  version: 1234,
};

describe("uploadVideoToCloudinary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).XMLHttpRequest = FakeXhr;
    FakeXhr.last = undefined;
    (apiClient.get as jest.Mock).mockResolvedValue({ data: SIGNATURE });
  });

  it("posts the signed fields, reports progress, and returns the transcoded mp4 + poster", async () => {
    const eager = [
      { secure_url: "https://cdn/eager/clip.mp4" },
      { secure_url: "https://cdn/eager/clip.jpg" },
    ];
    FakeXhr.respond = reply(200, { ...UPLOADED, eager });
    const onProgress = jest.fn();

    const result = await uploadVideoToCloudinary(
      { uri: "file:///clip.mov", mimeType: "video/quicktime", fileName: "clip.mov" },
      { onProgress }
    );

    expect(FakeXhr.last!.url).toBe("https://api.cloudinary.com/v1_1/test-cloud/video/upload");
    const form = FakeXhr.last!.body as FormData;
    expect(form.get("file")).toMatchObject({ uri: "file:///clip.mov", type: "video/quicktime" });
    expect(form.get("signature")).toBe("sig-abc");
    expect(form.get("eager")).toBe(SIGNATURE.eager);
    expect(form.get("resource_type")).toBeNull();
    expect(onProgress).toHaveBeenCalledWith(0.5);
    expect(onProgress).toHaveBeenLastCalledWith(1);
    expect(result).toEqual({
      videoUrl: "https://cdn/eager/clip.mp4",
      thumbnailUrl: "https://cdn/eager/clip.jpg",
    });
  });

  it("builds derivative URLs from the signed transformations if eager URLs are missing", async () => {
    FakeXhr.respond = reply(200, UPLOADED);
    const result = await uploadVideoToCloudinary("file:///clip.mov");

    expect(result).toEqual({
      videoUrl:
        "https://res.cloudinary.com/test-cloud/video/upload/c_limit,h_1280,w_720,q_auto,vc_h264/v1234/reels/clip.mp4",
      thumbnailUrl:
        "https://res.cloudinary.com/test-cloud/video/upload/so_0,c_limit,h_1280,w_720,q_auto/v1234/reels/clip.jpg",
    });
  });

  it("rejects oversized videos before uploading", async () => {
    await expect(
      uploadVideoToCloudinary({ uri: "file:///big.mp4", fileSize: 150 * 1024 * 1024 })
    ).rejects.toThrow("This video is 150MB. Please choose one under 100MB");
    expect(FakeXhr.last).toBeUndefined();
  });

  it("rejects videos longer than 60 seconds before asking for a signature", async () => {
    await expect(
      uploadVideoToCloudinary({ uri: "file:///long.mp4", duration: 95_000 })
    ).rejects.toThrow("Reels can be up to 60 seconds long");
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("surfaces Cloudinary's error message", async () => {
    FakeXhr.respond = reply(400, { error: { message: "Cloudinary rejected file" } });
    await expect(uploadVideoToCloudinary("file:///clip.mp4")).rejects.toThrow(
      "Cloudinary rejected file"
    );
  });

  it("reports network failures", async () => {
    FakeXhr.respond = (xhr) => xhr.onerror?.();
    await expect(uploadVideoToCloudinary("file:///clip.mp4")).rejects.toThrow(
      "Network error while uploading"
    );
  });
});
