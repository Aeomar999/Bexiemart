import { View, Text, Pressable } from "react-native";
import { Icon } from "./Icon";
import { Image } from "expo-image";
import { Card } from "./Card";
import { tokens } from "@/theme/tokens";

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
    const label = `${name}, price GHS ${numericPrice.toFixed(0)}${rating ? `, rating ${rating}` : ""}`;
    return (
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        className="w-[140px] active:opacity-70 mb-2"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Card variant="flat" padding="none">
          <View className="w-full h-[140px] rounded-[16px] bg-muted mb-2 items-center justify-center overflow-hidden relative">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Icon name="image" size={28} color={tokens.textDisabled} />
            )}
            {!!rating && (
              <View className="absolute bottom-2 left-2 flex-row items-center bg-card/90 backdrop-blur-md px-1.5 py-0.5 rounded-full">
                <Icon name="star" size={10} color={tokens.warning} />
                <Text className="text-[10px] font-bold text-foreground ml-1">{rating}</Text>
              </View>
            )}
          </View>
          <View className="px-1 gap-[2px]">
            <Text
              className="text-[14px] font-semibold text-foreground leading-[20px]"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className="text-[14px] font-extrabold text-foreground tracking-tight"
              style={{ fontVariant: ["tabular-nums"] }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              GHS {numericPrice.toFixed(0)}
            </Text>
          </View>
        </Card>
      </Pressable>
    );
  }

  if (variant === "horizontal") {
    const label = `${name}, price GHS ${numericPrice.toFixed(2)}${rating ? `, rating ${rating}` : ""}`;
    return (
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        className="w-full active:opacity-70 mb-3"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Card variant="outlined" padding="sm" className="flex-row">
          <View className="w-[80px] h-[80px] rounded-lg bg-muted items-center justify-center overflow-hidden mr-4">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Icon name="image" size={24} color={tokens.textDisabled} />
            )}
          </View>
          <View className="flex-1 justify-center">
            <View className="flex-row justify-between items-start mb-1">
              <Text
                className="text-body-lg font-bold text-foreground flex-1 pr-2"
                numberOfLines={1}
              >
                {name}
              </Text>
              {onFavoriteToggle && (
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  onPress={onFavoriteToggle}
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  accessibilityState={{ selected: isFavorite }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="p-1"
                >
                  <Icon
                    name="heart"
                    size={16}
                    color={isFavorite ? tokens.error : tokens.textDisabled}
                  />
                </Pressable>
              )}
            </View>
            {!!subtitle && (
              <Text className="text-body-sm text-muted-foreground font-body mb-2" numberOfLines={1}>
                {subtitle}
              </Text>
            )}
            <View className="flex-row items-center justify-between mt-auto">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-body-lg font-bold text-foreground">
                  GHS {numericPrice.toFixed(2)}
                </Text>
                {!!numericOldPrice && numericOldPrice > numericPrice && (
                  <Text className="text-caption text-muted-foreground line-through">
                    GHS {numericOldPrice.toFixed(2)}
                  </Text>
                )}
              </View>
              {!!rating && (
                <View className="flex-row items-center bg-background px-1.5 py-0.5 rounded-full">
                  <Icon name="star" size={10} color={tokens.warning} />
                  <Text className="text-caption font-bold text-muted-foreground ml-1">
                    {rating}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  }

  // Vertical Variant
  const label = `${name}, price GHS ${numericPrice.toFixed(2)}${rating ? `, rating ${rating}` : ""}`;
  return (
    <Pressable
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="flex-1 active:opacity-70 mb-3"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View className="w-full rounded-[16px] bg-card border border-border overflow-hidden">
        <View
          className="w-full bg-muted items-center justify-center relative overflow-hidden"
          style={{ aspectRatio: 1 }}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <Icon name="image" size={32} color={tokens.textDisabled} />
          )}
          {!!rating && (
            <View className="absolute bottom-2 left-2 flex-row items-center bg-card/90 backdrop-blur-md px-1.5 py-0.5 rounded-full">
              <Icon name="star" size={10} color={tokens.warning} />
              <Text className="text-[10px] font-bold text-foreground ml-1">{rating}</Text>
            </View>
          )}
          {onFavoriteToggle && (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
              accessibilityState={{ selected: isFavorite }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/90 items-center justify-center"
              onPress={onFavoriteToggle}
            >
              <Icon name="heart" size={15} color={isFavorite ? tokens.error : tokens.textMuted} />
            </Pressable>
          )}
        </View>
        <View className="p-3 gap-[2px]">
          <Text
            className="text-[14px] font-semibold text-foreground leading-[20px]"
            numberOfLines={1}
          >
            {name}
          </Text>
          {!!subtitle && (
            <Text
              className="text-[11px] text-muted-foreground font-body leading-[14px]"
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
          <View className="flex-row items-center gap-1.5 mt-1">
            <Text
              className="text-[15px] font-extrabold text-foreground tracking-[-0.02em]"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              GHS {numericPrice.toFixed(2)}
            </Text>
            {!!numericOldPrice && numericOldPrice > numericPrice && (
              <Text className="text-[11px] text-muted-foreground line-through">
                GHS {numericOldPrice.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
