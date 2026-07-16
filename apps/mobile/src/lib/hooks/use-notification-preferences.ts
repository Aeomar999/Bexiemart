import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  notificationPreferencesApi,
  NotificationPreferences,
} from "../api/notification-preferences";

const KEY = ["notification-preferences"] as const;

export function useNotificationPreferences() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => notificationPreferencesApi.get().then((r) => r.data),
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Omit<NotificationPreferences, "id" | "userId">>) =>
      notificationPreferencesApi.update(data).then((r) => r.data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<NotificationPreferences>(KEY);
      qc.setQueryData<NotificationPreferences>(KEY, (old) =>
        old ? { ...old, ...data } : undefined
      );
      return { prev };
    },
    onError: (_e, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
