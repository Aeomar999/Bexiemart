import { Text, TouchableOpacity, View, TouchableOpacityProps } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { useRouter } from "expo-router";

interface SearchBarProps extends Omit<TouchableOpacityProps, "onPress"> {
  placeholder?: string;
  onPress?: () => void;
  showCamera?: boolean;
}

export function SearchBar({
  placeholder = "Search Bexiemart...",
  onPress,
  showCamera = true,
  ...props
}: SearchBarProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(customer)/search");
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      className="flex-row items-center bg-background h-12 rounded-xl px-4 border border-border"
      onPress={handlePress}
      activeOpacity={0.9}
      {...props}
    >
      <Icon name="search" size={18} color="#64748b" />
      <Text className="flex-1 ml-2 text-body-lg font-body text-muted-foreground">
        {placeholder}
      </Text>
      {showCamera && (
        <View className="ml-2 w-8 h-8 items-center justify-center">
          <Icon name="camera" size={18} color="#64748b" />
        </View>
      )}
    </TouchableOpacity>
  );
}
