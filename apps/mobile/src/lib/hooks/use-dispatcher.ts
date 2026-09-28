import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dispatcherApi,
  CreateDispatcherProfileDto,
  UpdateDispatcherProfileDto,
} from "../api/dispatcher";

export const DISPATCHER_KEYS = {
  profile: ["dispatcher", "profile"],
  availableTasks: ["dispatcher", "tasks", "available"],
  myTasks: (status: string) => ["dispatcher", "tasks", "my", status],
};

export interface DispatcherProfile {
  id: string;
  userId: string;
  vehicleType: string;
  plateNumber: string;
  drivingLicense?: string;
  status: string;
  totalEarnings: string | number;
  pendingPayout: string | number;
}

export function useDispatcherProfile() {
  return useQuery({
    queryKey: DISPATCHER_KEYS.profile,
    queryFn: async () => {
      const { data } = await dispatcherApi.getProfile();
      return data as DispatcherProfile;
    },
  });
}

export function useCreateDispatcherProfile() {
  return useMutation({
    mutationFn: (data: CreateDispatcherProfileDto) => dispatcherApi.createProfile(data),
  });
}

export function useUpdateDispatcherProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateDispatcherProfileDto) => {
      const { data: profile } = await dispatcherApi.updateProfile(data);
      return profile as DispatcherProfile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(DISPATCHER_KEYS.profile, profile);
    },
  });
}

// The server is the source of truth for online/offline: the updated profile
// replaces the cached one only once the change has actually been saved.
export function useSetDispatcherStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: "ONLINE" | "OFFLINE") => {
      const { data: profile } = await dispatcherApi.updateStatus(status);
      return profile as DispatcherProfile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(DISPATCHER_KEYS.profile, profile);
    },
  });
}

export function useAvailableTasks(isOnline: boolean) {
  return useQuery({
    queryKey: DISPATCHER_KEYS.availableTasks,
    queryFn: async () => {
      const { data } = await dispatcherApi.getAvailableTasks();
      return data; // { jobs: DeliveryJob[], meta }
    },
    enabled: isOnline,
    refetchInterval: 5000, // Poll every 5s for real-time feel
  });
}

export function useMyTasks(status: "active" | "completed") {
  return useQuery({
    queryKey: DISPATCHER_KEYS.myTasks(status),
    queryFn: async () => {
      const { data } = await dispatcherApi.getMyTasks(status);
      return data;
    },
    refetchInterval: status === "active" ? 5000 : false,
  });
}

export function useAcceptTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId }: { taskId: string }) => dispatcherApi.acceptTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISPATCHER_KEYS.availableTasks });
      queryClient.invalidateQueries({ queryKey: DISPATCHER_KEYS.myTasks("active") });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      dispatcherApi.updateTaskStatus(taskId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DISPATCHER_KEYS.myTasks("active") });
      if (variables.status === "DELIVERED" || variables.status === "CANCELLED") {
        queryClient.invalidateQueries({ queryKey: DISPATCHER_KEYS.myTasks("completed") });
        queryClient.invalidateQueries({ queryKey: ["dispatcher", "earnings"] });
      }
    },
  });
}

export function useDispatcherEarnings() {
  return useQuery({
    queryKey: ["dispatcher", "earnings"],
    queryFn: async () => {
      const { data } = await dispatcherApi.getEarnings();
      return data;
    },
  });
}

export function useDispatcherTransactions() {
  return useQuery({
    queryKey: ["dispatcher", "transactions"],
    queryFn: async () => {
      const { data } = await dispatcherApi.getTransactions();
      return data;
    },
  });
}

export function useDispatcherAnalytics() {
  return useQuery({
    queryKey: ["dispatcher", "analytics"],
    queryFn: async () => {
      const { data } = await dispatcherApi.getAnalytics();
      return data;
    },
  });
}
