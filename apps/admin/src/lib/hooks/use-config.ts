import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getConfig, updateConfig } from "../api/admin";

export const useConfig = () => {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => getConfig(),
  });
};

export const useUpdateConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => updateConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      toast.success("Platform settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update settings");
    }
  });
};
