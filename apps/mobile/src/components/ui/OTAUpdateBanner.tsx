import React from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "./Icon";
import { useOTAUpdate } from "@/hooks/useOTAUpdate";
import { tokens } from "@/theme/tokens";

export function OTAUpdateBanner() {
  const insets = useSafeAreaInsets();
  const { isUpdateReady, applyUpdate, isDownloading } = useOTAUpdate();

  if (!isUpdateReady && !isDownloading) return null;

  return (
    <View
      className="absolute left-4 right-4 z-50 bg-foreground rounded-2xl flex-row items-center justify-between p-4 shadow-xl"
      style={{ top: Math.max(insets.top, 16) }}
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
          <Icon name={"refresh-cw"} size={20} color={tokens.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-background mb-0.5">
            {isUpdateReady ? "Update Ready" : "Downloading Update..."}
          </Text>
          <Text className="text-[13px] text-background/80 font-body">
            {isUpdateReady
              ? "A new version of BexieMart is ready to be installed."
              : "We're downloading a new version in the background."}
          </Text>
        </View>
      </View>

      {isUpdateReady && (
        <Pressable
          onPress={applyUpdate}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="bg-primary px-4 py-2 rounded-full"
        >
          <Text className="text-white font-bold text-[13px]">Restart</Text>
        </Pressable>
      )}
    </View>
  );
}
