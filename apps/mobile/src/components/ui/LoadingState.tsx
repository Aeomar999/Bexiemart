import { tokens } from "@/theme/tokens";
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { ListSkeleton, DetailSkeleton, ProfileSkeleton, GridSkeleton } from "./Skeleton";

interface LoadingStateProps {
  message?: string;
  /**
   * Loading presentation. Defaults to a skeleton (`list`) so pages never flash
   * a bare spinner. Use `spinner` only for short, non-content waits where a
   * skeleton would be misleading.
   */
  type?: "spinner" | "list" | "detail" | "profile" | "grid";
}

export function LoadingState({ message = "Loading...", type = "list" }: LoadingStateProps) {
  if (type === "list") {
    return <ListSkeleton />;
  }

  if (type === "detail") {
    return <DetailSkeleton />;
  }

  if (type === "profile") {
    return <ProfileSkeleton />;
  }

  if (type === "grid") {
    return <GridSkeleton />;
  }

  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      <ActivityIndicator size="large" color={tokens.primary} />
      {message && (
        <Text className="mt-4 text-body-lg font-bold text-muted-foreground text-center">
          {message}
        </Text>
      )}
    </View>
  );
}

export * from "./Skeleton";
