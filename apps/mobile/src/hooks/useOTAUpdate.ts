import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Updates from "expo-updates";
import * as Sentry from "@sentry/react-native";
import { create } from "zustand";
import { logger } from "@/lib/logger";
import { posthog } from "@/lib/posthog";

export type OTACheckResult = "update-ready" | "up-to-date" | "error" | "skipped";

interface OTAUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  error: Error | null;
  checkForUpdate: () => Promise<OTACheckResult>;
  applyUpdate: () => Promise<void>;
}

// Single shared owner of OTA state so the root auto-check, the banner and the
// profile "check for updates" row all see the same download/ready status.
export const useOTAStore = create<OTAUpdateState>()((set, get) => ({
  isChecking: false,
  isDownloading: false,
  isUpdateAvailable: false,
  isUpdateReady: false,
  error: null,

  checkForUpdate: async () => {
    if (__DEV__) return "skipped";
    if (get().isUpdateReady) return "update-ready";
    if (get().isChecking) return "skipped";

    try {
      set({ isChecking: true, error: null });
      const update = await Updates.checkForUpdateAsync();

      if (!update.isAvailable) return "up-to-date";

      set({ isUpdateAvailable: true, isDownloading: true });
      posthog?.capture("ota_update_available");
      const fetchResult = await Updates.fetchUpdateAsync();
      if (!fetchResult.isNew) return "up-to-date";

      set({ isUpdateReady: true });
      posthog?.capture("ota_update_downloaded");
      logger.info("OTA Update downloaded and ready to apply");
      return "update-ready";
    } catch (err: any) {
      logger.error("Failed to check or fetch OTA update:", err);
      Sentry.captureException(err);
      posthog?.capture("ota_update_error", { error: err?.message || String(err) });
      set({ error: err instanceof Error ? err : new Error(String(err)) });
      return "error";
    } finally {
      set({ isChecking: false, isDownloading: false });
    }
  },

  applyUpdate: async () => {
    if (__DEV__ || !get().isUpdateReady) return;
    try {
      await Updates.reloadAsync();
    } catch (err: any) {
      logger.error("Failed to reload app for OTA update:", err);
      Sentry.captureException(err);
      set({ error: err instanceof Error ? err : new Error(String(err)) });
    }
  },
}));

/**
 * Reads the shared OTA state. Pass `autoCheck` from exactly one place (the root
 * layout) to check on mount and whenever the app returns to the foreground.
 */
export function useOTAUpdate({ autoCheck = false }: { autoCheck?: boolean } = {}): OTAUpdateState {
  const state = useOTAStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (__DEV__ || !autoCheck) return;
    const { checkForUpdate } = useOTAStore.getState();

    setTimeout(() => {
      checkForUpdate();
    }, 0);

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        checkForUpdate();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [autoCheck]);

  return state;
}
