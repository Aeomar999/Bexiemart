import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dispatcherApi, CreateDispatcherProfileDto } from "../api/dispatcher";

export const DISPATCHER_KEYS = {
  availableTasks: ["dispatcher", "tasks", "available"],
  myTasks: (status: string) => ["dispatcher", "tasks", "my", status],
};

export function useCreateDispatcherProfile() {
  return useMutation({
    mutationFn: (data: CreateDispatcherProfileDto) => dispatcherApi.createProfile(data),
  });
}

export function useAvailableTasks(isOnline: boolean) {
  return useQuery({
    queryKey: DISPATCHER_KEYS.availableTasks,
    queryFn: async () => {
      const { data } = await dispatcherApi.getAvailableTasks();
      return data; // { rides: [], deliveries: [] }
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
    mutationFn: ({ taskId, type }: { taskId: string; type: "ride" | "delivery" }) => 
      dispatcherApi.acceptTask(taskId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISPATCHER_KEYS.availableTasks });
      queryClient.invalidateQueries({ queryKey: DISPATCHER_KEYS.myTasks("active") });
    }
  });
}

  export function useUpdateTaskStatus() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ taskId, status, type }: { taskId: string; status: string; type: "ride" | "delivery" }) => 
        dispatcherApi.updateTaskStatus(taskId, status, type),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: DISPATCHER_KEYS.myTasks("active") });
        if (variables.status === "COMPLETED" || variables.status === "CANCELLED") {
          queryClient.invalidateQueries({ queryKey: DISPATCHER_KEYS.myTasks("completed") });
          queryClient.invalidateQueries({ queryKey: ["dispatcher", "earnings"] });
        }
      }
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
  
  export function useWithdrawEarnings() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ amount, destination }: { amount: number; destination: string }) =>
        dispatcherApi.withdrawEarnings(amount, destination),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["dispatcher", "earnings"] });
        queryClient.invalidateQueries({ queryKey: ["dispatcher", "transactions"] });
      },
    });
  }
