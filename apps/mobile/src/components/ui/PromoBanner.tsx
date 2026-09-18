import { View, Text, Pressable, Dimensions } from "react-native";
import { useState, useCallback } from "react";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";
import { useBanners } from "@/lib/hooks/use-banners";
import { Banner, BannerPlacement } from "@/lib/api/banners";
import { tokens } from "@/theme/tokens";

interface PromoBannerProps {
  /** Which screen's banners to load (HOME | FOOD | SERVICES). */
  placement: BannerPlacement;
  /** Wrapper className for vertical spacing on the host screen. */
  containerClassName?: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

/**
 * Reusable promotional banner carousel. Dimensions and styling are locked to the
 * customer home hero banner (180px card, rounded-2xl, 20px gutter, image + dark
 * overlay, optional badge/CTA, paging dots). Content is backend-driven via the
 * `useBanners` hook — never mocked. Renders nothing when a placement has no
 * active banners so screens degrade cleanly.
 */
export function PromoBanner({ placement, containerClassName = "mt-4" }: PromoBannerProps) {
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
          <Skeleton width="100%" height={180} borderRadius={16} />
        </View>
      </View>
    );
  }

  const banners = data ?? [];
  if (isError || banners.length === 0) return null;

  return (
    <View className={containerClassName}>
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
        <View className="flex-row justify-center items-center mt-3 gap-1.5">
          {banners.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${i === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-secondary"}`}
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

import { LinearGradient } from "expo-linear-gradient";

function BannerCard({ banner, onPress }: { banner: Banner; onPress?: () => void }) {
  const cardClass =
    "w-full h-[128px] rounded-[16px] overflow-hidden relative bg-surface-900" +
    (onPress ? " active:opacity-70" : "");

  return (
    <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20, paddingBottom: 16 }}>
      <View className="rounded-[16px] border border-black/5 bg-black" style={{}}>
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
            colors={[tokens.moneyGrad1, tokens.moneyGrad2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="absolute inset-0 opacity-90"
          />

          <View className="flex-1 p-4 justify-center">
            {banner.badge ? (
              <View className="bg-success self-start px-2 py-1 rounded-md mb-1">
                <Text className="text-caption font-bold text-white uppercase tracking-wider">
                  {banner.badge}
                </Text>
              </View>
            ) : null}

            <Text className="text-white text-[24px] leading-[28px] font-heading font-black w-3/4 mb-0.5 tracking-[-0.01em]">
              {banner.title}
            </Text>

            {banner.subtitle ? (
              <Text className="text-white/90 text-[12px] font-body mb-2">{banner.subtitle}</Text>
            ) : (
              <View className="mb-2" />
            )}

            {banner.ctaLabel ? (
              <View className="bg-card self-start flex-row items-center rounded-full px-3 py-1.5">
                <Text className="text-foreground font-bold text-[11px] mr-1">
                  {banner.ctaLabel}
                </Text>
                <Icon name="arrow-right" size={12} color={tokens.textPrimary} />
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}
