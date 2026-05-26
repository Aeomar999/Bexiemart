import { View, ActivityIndicator, Text } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({
  size = "large",
  color = "#004CFF",
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-card/80">
        <ActivityIndicator size={size} color={color} />
        {message && (
          <Text className="mt-4 text-body-md text-muted-foreground font-body">
            {message}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="mt-3 text-body-sm text-muted-foreground font-body">
          {message}
        </Text>
      )}
    </View>
  );
}