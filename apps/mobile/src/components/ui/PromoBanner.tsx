import { View, Text, Pressable, Dimensions } from "react-native";
import { useState, useCallback } from "react";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";
import { useBanners } from "@/lib/hooks/use-banners";
import { Banner, BannerPlacement } from "@/lib/api/banners";
import { LinearGradient } from "expo-linear-gradient";

interface PromoBannerProps {
  /** Which screen's banners to load (HOME | FOOD | SERVICES). */
  placement: BannerPlacement;
  /** Wrapper className for vertical spacing on the host screen. */
  containerClassName?: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export function PromoBanner({ placement, containerClassName = "mt-4 mb-4" }: PromoBannerProps) {
  const router = useRouter();
  const { data, isPending, isError } = useBanners(placement);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
    },
    []
  );

  if (isPending) {
    return (
      <View className={containerClassName}>
        <View style={{ paddingHorizontal: 20 }}>
          <Skeleton width="100%" height={160} borderRadius={16} />
        </View>
      </View>
    );
  }

  const banners = data ?? [];
  if (isError || banners.length === 0) return null;

  return (
    <View className={containerClassName} style={{ position: "relative" }}>
      <FlashList
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BannerCard banner={item} onPress={handlePress(router, item)} />}
      />
      {banners.length > 1 && (
        <View
          className="absolute bottom-4 left-0 right-0 flex-row justify-center items-center gap-1.5"
          pointerEvents="none"
        >
          {banners.map((_, i) => (
            <View
              key={i}
              className={`h-[4px] rounded-full ${i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function handlePress(router: ReturnType<typeof useRouter>, banner: Banner) {
  if (!banner.ctaRoute) return undefined;
  return () => router.push(banner.ctaRoute as never);
}

function BannerCard({ banner, onPress }: { banner: Banner; onPress?: () => void }) {
  const cardClass =
    "w-full h-[170px] rounded-2xl overflow-hidden relative bg-black" +
    (onPress ? " active:opacity-90" : "");

  return (
    <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}>
      <Pressable
        className={cardClass}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : "none"}
        accessibilityLabel={`${banner.title}, ${banner.subtitle}`}
      >
        <Image
          source={{ uri: banner.imageUrl }}
          style={{ width: "100%", height: "100%", position: "absolute" }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.85)", "rgba(0,0,0,0.15)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="absolute inset-0"
        />

        <View className="flex-1 p-5 justify-center">
          {banner.badge ? (
            <View className="bg-success self-start px-2 py-0.5 rounded flex-row items-center mb-2">
              <Text className="text-[10px] font-bold text-white uppercase tracking-[0.1em]">
                {banner.badge}
              </Text>
            </View>
          ) : null}

          <Text
            className="text-white text-[26px] leading-[28px] font-heading font-black w-[75%] mb-1.5 tracking-[-0.02em]"
            numberOfLines={2}
          >
            {banner.title}
          </Text>

          {banner.subtitle ? (
            <Text className="text-white/80 text-[13px] font-body mb-3">{banner.subtitle}</Text>
          ) : (
            <View className="mb-3" />
          )}

          {banner.ctaLabel ? (
            <View className="bg-white self-start flex-row items-center rounded-full px-4 py-[6px]">
              <Text className="text-black font-bold text-[12px] mr-1.5">{banner.ctaLabel}</Text>
              <Icon name="arrow-right" size={12} color="#000" />
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
