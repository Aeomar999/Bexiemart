import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/upload", () => ({
  uploadApi: {
    uploadFile: jest.fn(),
  },
}));;

import { useUpload } from "../use-upload";
import { uploadApi } from "../../api/upload";
import { createWrapper } from "./test-utils";

describe("useUpload", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should upload a single file", async () => {
    (uploadApi.uploadFile as jest.Mock).mockResolvedValue({ data: { url: "https://cdn.example.com/file.jpg" } });
    const { result} = renderHook(() => useUpload(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ uri: "file:///photo.jpg", name: "photo.jpg", type: "image/jpeg" });
    expect(uploadApi.uploadFile).toHaveBeenCalledWith({ uri: "file:///photo.jpg", name: "photo.jpg", type: "image/jpeg" });
  });

  it("should handle upload error", async () => {
    (uploadApi.uploadFile as jest.Mock).mockRejectedValue(new Error("Upload failed"));
    const { result} = renderHook(() => useUpload(), { wrapper: createWrapper() });
    result.current.mutate({ uri: "file:///photo.jpg", name: "photo.jpg", type: "image/jpeg" });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("should return uploaded file url", async () => {
    (uploadApi.uploadFile as jest.Mock).mockResolvedValue({ data: { url: "https://cdn.example.com/file.jpg", publicId: "abc123" } });
    const { result} = renderHook(() => useUpload(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ uri: "file:///doc.pdf", name: "doc.pdf", type: "application/pdf" });
    await waitFor(() => {
      expect(result.current.data).toEqual({ data: { url: "https://cdn.example.com/file.jpg", publicId: "abc123" } });
    });
  });
});
