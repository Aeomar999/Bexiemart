import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import { router } from "expo-router";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";

interface BackButtonProps extends TouchableOpacityProps {
  onPress?: () => void;
  iconColor?: string;
  color?: string; // alias for iconColor
  className?: string;
}

export function BackButton({ 
  onPress, 
  iconColor, 
  color,
  className = "", 
  ...props 
}: BackButtonProps) {
  const finalIconColor = color || iconColor || "#475569";
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push("/");
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`w-10 h-10 rounded-full bg-card border border-border items-center justify-center ${className}`}
      {...props}
    >
      <FontAwesome5 name="arrow-left" size={16} color={finalIconColor} />
    </TouchableOpacity>
  );
}
