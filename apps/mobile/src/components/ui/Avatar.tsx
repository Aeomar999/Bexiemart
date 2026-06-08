import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Icon } from "./Icon";

export interface AvatarProps {
  uri?: string | null;
  name?: string; // For initials fallback
  size?: number; // Default 48
  fallback?: "initials" | "icon" | "dicebear";
  iconName?: string; // Icon name for icon fallback
  onPress?: () => void;
  editable?: boolean; // Shows edit overlay
}

export function Avatar({
  uri,
  name,
  size = 48,
  fallback = "initials",
  iconName = "user",
  onPress,
  editable = false,
}: AvatarProps) {
  const renderFallback = () => {
    if (fallback === "dicebear") {
      const defaultUri = `https://api.dicebear.com/7.x/micah/png?seed=${name || "default"}&backgroundColor=f8fafc`;
      return (
        <Image
          source={{ uri: defaultUri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      );
    }

    if (fallback === "icon") {
      return <Icon name={iconName} size={size * 0.4} color="#64748b" />;
    }

    // Default to initials
    const initial = name ? name.charAt(0).toUpperCase() : "?";
    return (
      <Text style={{ fontSize: size * 0.4 }} className="font-heading font-black text-brand-600">
        {initial}
      </Text>
    );
  };

  const content = (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-brand-100 items-center justify-center border-4 border-card shadow-sm overflow-hidden relative"
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      ) : (
        renderFallback()
      )}

      {editable && (
        <View className="absolute inset-0 bg-black/40 items-center justify-center">
          <Icon name="camera" size={size * 0.3} color="#ffffff" />
        </View>
      )}
    </View>
  );

  if (onPress || editable) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}
