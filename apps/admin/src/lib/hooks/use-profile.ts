import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUserFriendlyErrorMessage } from "@/lib/error-utils";
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
      toast.error(getUserFriendlyErrorMessage(error, "We couldn't save your profile changes. Please try again."));
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
      toast.error(getUserFriendlyErrorMessage(error, "We couldn't update your password. Please try again."));
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
      toast.error(getUserFriendlyErrorMessage(error, "Your photo couldn't be uploaded. Please try a smaller image file."));
    }
  });
};
