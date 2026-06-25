import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProfile, updatePassword, uploadFile } from "../api/auth";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name?: string; image?: string }) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    }
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (payload: { currentPassword?: string; newPassword?: string }) => updatePassword(payload),
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update password");
    }
  });
};

export const useUploadAvatar = () => {
  return useMutation({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: () => {
      toast.success("Avatar uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to upload avatar");
    }
  });
};
