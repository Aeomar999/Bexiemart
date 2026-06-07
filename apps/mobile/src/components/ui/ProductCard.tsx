import { View, Text, Pressable } from "react-native";
import { Icon } from "./Icon";
import { Image } from "expo-image";
import { Card } from "./Card";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  imageUrl?: string;
  rating?: number;
  subtitle?: string;
  isFavorite?: boolean;
  onPress?: () => void;
  onFavoriteToggle?: () => void;
  variant?: "vertical" | "horizontal" | "compact";
}

export function ProductCard({
  id,
  name,
  price,
  oldPrice,
  imageUrl,
  rating,
  subtitle,
  isFavorite,
  onPress,
  onFavoriteToggle,
  variant = "vertical",
}: ProductCardProps) {
  const numericPrice = Number(price) || 0;
  const numericOldPrice = oldPrice ? Number(oldPrice) : undefined;

  if (variant === "compact") {
    return (
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        className="w-[110px] active:opacity-70 mb-2"
        onPress={onPress}
      >
        <Card variant="flat" padding="none">
          <View className="w-full h-[150px] rounded-[16px] bg-muted mb-2 items-center justify-center overflow-hidden">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Icon name="image" size={28} color="#cbd5e1" />
            )}
          </View>
          <View className="flex-row justify-between items-center px-1">
            <View className="flex-row items-center">
              <Text className="text-[12px] font-bold text-foreground">
                GHS {numericPrice.toFixed(0)}
              </Text>
              {rating && <Icon name="star" size={10} color="#f59e0b" style={{ marginLeft: 4 }} />}
            </View>
            {rating && <Text className="text-[10px] text-muted-foreground">{rating}</Text>}
          </View>
        </Card>
      </Pressable>
    );
  }

  if (variant === "horizontal") {
    return (
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        className="w-full active:opacity-70 mb-3"
        onPress={onPress}
      >
        <Card variant="outlined" padding="sm" className="flex-row">
          <View className="w-[80px] h-[80px] rounded-[12px] bg-muted items-center justify-center overflow-hidden mr-4">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Icon name="image" size={24} color="#cbd5e1" />
            )}
          </View>
          <View className="flex-1 justify-center">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-[15px] font-bold text-foreground flex-1 pr-2" numberOfLines={1}>
                {name}
              </Text>
              {onFavoriteToggle && (
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  onPress={onFavoriteToggle}
                  className="p-1"
                >
                  <Icon name="heart" size={16} color={isFavorite ? "#ef4444" : "#cbd5e1"} />
                </Pressable>
              )}
            </View>
            {subtitle && (
              <Text className="text-[12px] text-muted-foreground font-body mb-2" numberOfLines={1}>
                {subtitle}
              </Text>
            )}
            <View className="flex-row items-center justify-between mt-auto">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[15px] font-bold text-foreground">
                  GHS {numericPrice.toFixed(2)}
                </Text>
                {numericOldPrice && numericOldPrice > numericPrice && (
                  <Text className="text-[11px] text-muted-foreground line-through">
                    GHS {numericOldPrice.toFixed(2)}
                  </Text>
                )}
              </View>
              {rating && (
                <View className="flex-row items-center bg-background px-1.5 py-0.5 rounded-full">
                  <Icon name="star" size={10} color="#f59e0b" />
                  <Text className="text-[10px] font-bold text-muted-foreground ml-1">{rating}</Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  }

  // Vertical Variant
  return (
    <Pressable
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="w-[140px] active:opacity-70 mb-2"
      onPress={onPress}
    >
      <Card variant="flat" padding="none">
        <View className="w-full aspect-square rounded-[16px] bg-muted mb-2 items-center justify-center relative overflow-hidden">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <Icon name="image" size={32} color="#cbd5e1" />
          )}
          {onFavoriteToggle && (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/90 items-center justify-center"
              onPress={onFavoriteToggle}
            >
              <Icon name="heart" size={15} color={isFavorite ? "#ef4444" : "#64748b"} />
            </Pressable>
          )}
        </View>
        <Text className="text-[14px] font-bold text-foreground" numberOfLines={1}>
          {name}
        </Text>
        {subtitle && (
          <Text className="text-[11px] text-muted-foreground font-body mb-1" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[14px] font-bold text-foreground">
            GHS {numericPrice.toFixed(2)}
          </Text>
          {numericOldPrice && numericOldPrice > numericPrice && (
            <Text className="text-[10px] text-muted-foreground line-through">
              GHS {numericOldPrice.toFixed(2)}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
