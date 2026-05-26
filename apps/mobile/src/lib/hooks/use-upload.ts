import { useMutation } from "@tanstack/react-query";
import { uploadApi } from "../api/upload";

export function useUpload() {
  return useMutation({
    mutationFn: (file: { uri: string; name: string; type: string }) =>
      uploadApi.uploadFile(file),
  });
}
