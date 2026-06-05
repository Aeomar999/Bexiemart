import PostHog from "posthog-react-native";
import * as Application from "expo-application";
import * as Device from "expo-device";

// Setup PostHog instance
let posthog: PostHog | null = null;

if (process.env.EXPO_PUBLIC_POSTHOG_API_KEY && process.env.EXPO_PUBLIC_POSTHOG_HOST) {
  posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY, {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    enableSessionReplay: false, // Session replay disabled on mobile normally
    captureApplicationLifecycleEvents: true, // Auto-capture app opens/backgrounds
    captureDeepLinks: true, // Auto-capture deep links
    bootstrap: {
      distinctId: Device.osBuildId || Application.applicationId || "anonymous",
    },
    customCoreProperties: {
      appVersion: Application.nativeApplicationVersion || "dev",
      buildNumber: Application.nativeBuildVersion || "dev",
    },
  });
}

export { posthog };
