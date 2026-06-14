import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { ListSkeleton, DetailSkeleton, ProfileSkeleton } from "./Skeleton";

interface LoadingStateProps {
  message?: string;
  type?: "spinner" | "list" | "detail" | "profile";
}

export function LoadingState({ message = "Loading...", type = "spinner" }: LoadingStateProps) {
  if (type === "list") {
    return <ListSkeleton />;
  }

  if (type === "detail") {
    return <DetailSkeleton />;
  }

  if (type === "profile") {
    return <ProfileSkeleton />;
  }

  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      <ActivityIndicator size="large" color="var(--color-primary)" />
      {message && (
        <Text className="mt-4 text-[15px] font-bold text-muted-foreground text-center">
          {message}
        </Text>
      )}
    </View>
  );
}

export * from "./Skeleton";
