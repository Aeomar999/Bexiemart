import { useEffect, useState } from "react";
import { posthog } from "./posthog";

/**
 * PostHog feature flag keys. Each must have a matching boolean flag configured
 * in the PostHog project for the remote toggle to take effect.
 */
export const FeatureFlag = {
  /**
   * Controls the mobile authentication wall. When this flag is turned OFF in
   * PostHog, the auth pages (login/register/verify/…) are bypassed and
   * unauthenticated users browse the app as guests instead of being routed to
   * login.
   */
  MobileAuth: "mobile-auth",
} as const;

/**
 * Resolves the `mobile-auth` PostHog flag from the singleton client.
 *
 * We read from the singleton rather than the `useFeatureFlag` hook because the
 * root layout that drives navigation lives *above* <PostHogProvider> and has no
 * provider context. Reading the singleton also lets the same hook be used from
 * any screen.
 *
 * Fail-safe: defaults to auth ENABLED, so a missing flag, an unconfigured
 * PostHog client, or an unreachable network can never accidentally drop the
 * login wall. `ready` lets the caller wait for the resolved value to avoid a
 * brief login→home flash, but is force-resolved after a short timeout so a slow
 * PostHog can't trap the user on the splash screen.
 */
export function useAuthEnabled(): { authEnabled: boolean; ready: boolean } {
  const [authEnabled, setAuthEnabled] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // PostHog isn't configured (e.g. local dev without keys): keep the default
    // behavior of auth enabled and don't block routing.
    if (!posthog) {
      setReady(true);
      return;
    }

    const apply = () => {
      // `undefined` (flag not loaded / does not exist) keeps the safe default of
      // enabled — only an explicit `false` disables the auth wall.
      setAuthEnabled(posthog!.isFeatureEnabled(FeatureFlag.MobileAuth) !== false);
      setReady(true);
    };

    // A value cached from a previous launch is available synchronously.
    if (posthog.isFeatureEnabled(FeatureFlag.MobileAuth) !== undefined) {
      apply();
    }

    // Fires once flags finish loading (and on subsequent reloads).
    const unsubscribe = posthog.onFeatureFlags(apply);

    // Don't let a slow/unreachable PostHog block navigation indefinitely.
    const timeout = setTimeout(() => setReady(true), 2000);

    return () => {
      unsubscribe?.();
      clearTimeout(timeout);
    };
  }, []);

  return { authEnabled, ready };
}
