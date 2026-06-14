import { View, Text, FlatList, Dimensions, Animated } from "react-native";
import { useRef, useState, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Icon } from "./Icon";

interface CarouselProps {
  items: {
    id: string;
    imageUrl: string;
    title?: string;
    subtitle?: string;
    onPress?: () => void;
  }[];
  autoPlay?: boolean;
  interval?: number;
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function Carousel({ items, autoPlay = true, interval = 4000, height = 180 }: CarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % items.length;
      setActiveIndex(nextIndex);
      scrollToIndex(nextIndex);
    }, interval);

    return () => clearInterval(timer);
  }, [activeIndex, autoPlay, items.length, interval, scrollToIndex]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{ width: SCREEN_WIDTH - 32 }}
            className="mx-4 rounded-3xl overflow-hidden shadow-md bg-secondary"
          >
            <View className="w-full relative" style={{ height }}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-full h-full absolute"
                  contentFit="cover"
                />
              ) : (
                <LinearGradient
                  colors={["#3b82f6", "#8b5cf6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-full h-full absolute"
                />
              )}

              <LinearGradient
                colors={["transparent", item.imageUrl ? "rgba(0,0,0,0.6)" : "transparent"]}
                className="absolute bottom-0 w-full h-full justify-end p-5 rounded-b-3xl"
              >
                <Text className="text-white text-display-sm font-heading font-bold mb-1 shadow-sm">
                  {item.title ?? ""}
                </Text>
                {item.subtitle && (
                  <Text className="text-white/90 text-body-md font-body shadow-sm">
                    {item.subtitle}
                  </Text>
                )}
              </LinearGradient>
            </View>
          </View>
        )}
      />
      {items.length > 1 && (
        <View className="flex-row justify-center gap-2 mt-4 mb-2">
          {items.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${index === activeIndex ? "bg-primary w-6" : "bg-secondary w-2"}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
