import { View, Text, Pressable } from "react-native";
import { Icon } from "./Icon";
import { Image } from "expo-image";
import { Card } from "./Card";

interface CategoryCardProps {
  id: string;
  name: string;
  count: number;
  imageUrls?: string[];
  onPress?: () => void;
  width?: string;
}

export function CategoryCard({
  id,
  name,
  count,
  imageUrls,
  onPress,
  width = "48%",
}: CategoryCardProps) {
  return (
    <Pressable
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, width: width as any })}
      className="mb-4"
      onPress={onPress}
    >
      <Card variant="outlined" padding="sm">
        <View
          className="w-full rounded-[16px] bg-background mb-2 overflow-hidden flex-row flex-wrap"
          style={{ aspectRatio: 1 }}
        >
          {[0, 1, 2, 3].map((idx) => (
            <View
              key={idx}
              className={`w-1/2 h-1/2 border border-card items-center justify-center ${
                idx === 0 || idx === 3 ? "bg-muted" : "bg-secondary"
              }`}
            >
              {imageUrls && imageUrls[idx] ? (
                <Image
                  source={{ uri: imageUrls[idx] }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <Icon name="image" size={16} color="#cbd5e1" />
              )}
            </View>
          ))}
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-[12px] font-bold text-foreground w-2/3" numberOfLines={1}>
            {name}
          </Text>
          <View className="bg-primary-subtle px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-primary">{count}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
