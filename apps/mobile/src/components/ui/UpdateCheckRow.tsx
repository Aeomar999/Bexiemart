import { View, Text, Pressable, ActivityIndicator } from "react-native";
import * as Application from "expo-application";
import * as Updates from "expo-updates";
import { Icon } from "./Icon";
import { useOTAUpdate } from "@/hooks/useOTAUpdate";
import Toast from "@/lib/toast-polyfill";
import { tokens } from "@/theme/tokens";

/** Version shown to users and support: native version, plus the OTA id when one is running. */
export function getAppVersionLabel(): string {
  const nativeVersion = Application.nativeApplicationVersion ?? "";
  if (Updates.isEmbeddedLaunch || !Updates.updateId) return nativeVersion;
  return `${nativeVersion} · ${Updates.updateId.substring(0, 7)}`;
}

interface UpdateCheckRowProps {
  tint?: string;
  last?: boolean;
}

/**
 * Settings-list row shared by the customer, vendor and dispatcher screens.
 * Checks for an OTA update on tap; once one is downloaded, tapping restarts
 * into it (the global OTAUpdateBanner offers the same action).
 */
export function UpdateCheckRow({ tint = "#0ea5e9", last }: UpdateCheckRowProps) {
  const { checkForUpdate, applyUpdate, isChecking, isDownloading, isUpdateReady } = useOTAUpdate();
  const busy = isChecking || isDownloading;
  const label = isUpdateReady ? "Restart to Update" : "Check for Updates";

  const handlePress = async () => {
    if (isUpdateReady) {
      await applyUpdate();
      return;
    }
    const result = await checkForUpdate();
    if (result === "up-to-date") {
      Toast.show({
        type: "success",
        text1: "Up to date",
        text2: "You are on the latest version of BexieMart.",
      });
    } else if (result === "error") {
      Toast.show({
        type: "error",
        text1: "Couldn't check for updates",
        text2: "Please try again later.",
      });
    } else if (result === "skipped" && (__DEV__ || !Updates.isEnabled)) {
      Toast.show({
        type: "info",
        text1: "Updates unavailable",
        text2: "Over-the-air updates are disabled in this build.",
      });
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={
        isUpdateReady ? "Restarts the app to apply the downloaded update" : undefined
      }
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={handlePress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className={`flex-row items-center justify-between h-[52px] px-4 ${last ? "" : "border-b border-border"}`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="w-8 h-8 rounded-xl items-center justify-center"
          style={{ backgroundColor: `${tint}15` }}
        >
          <Icon name="refresh-cw" size={16} color={tint} />
        </View>
        <Text className="text-[15px] font-bold text-foreground">{label}</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {busy ? (
          <ActivityIndicator size="small" color={tokens.primary} style={{ marginRight: 4 }} />
        ) : (
          <Text className="text-[12px] text-muted-foreground mr-1">{getAppVersionLabel()}</Text>
        )}
        <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
      </View>
    </Pressable>
  );
}
