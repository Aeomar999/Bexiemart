import { useEffect, useState, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Updates from "expo-updates";
import * as Sentry from "@sentry/react-native";
import { logger } from "@/lib/logger";

interface OTAUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  error: Error | null;
  checkForUpdate: () => Promise<void>;
  applyUpdate: () => Promise<void>;
}

export function useOTAUpdate(): OTAUpdateState {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const appState = useRef(AppState.currentState);

  const checkForUpdate = async () => {
    if (__DEV__) return;

    try {
      setIsChecking(true);
      setError(null);
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setIsUpdateAvailable(true);
        setIsDownloading(true);
        const fetchResult = await Updates.fetchUpdateAsync();
        if (fetchResult.isNew) {
          setIsUpdateReady(true);
          logger.info("OTA Update downloaded and ready to apply");
        }
      }
    } catch (err: any) {
      logger.error("Failed to check or fetch OTA update:", err);
      Sentry.captureException(err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsChecking(false);
      setIsDownloading(false);
    }
  };

  const applyUpdate = async () => {
    if (__DEV__ || !isUpdateReady) return;
    try {
      await Updates.reloadAsync();
    } catch (err: any) {
      logger.error("Failed to reload app for OTA update:", err);
      Sentry.captureException(err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  useEffect(() => {
    if (__DEV__) return;

    // Check for updates on initial mount
    checkForUpdate();

    // Check for updates when app returns to active state from background
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        checkForUpdate();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    isChecking,
    isDownloading,
    isUpdateAvailable,
    isUpdateReady,
    error,
    checkForUpdate,
    applyUpdate,
  };
}
