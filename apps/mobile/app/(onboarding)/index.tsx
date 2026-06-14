import React, { useRef, useState } from "react";
import { View, Text, Dimensions, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { Button } from "../../src/components/ui/Button";
import { ArrowLeft } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    titleStart: "Shop",
    titleBold: "Campus",
    titleEnd: "Without The Hassle",
    description: "Discover the best products from vendors right inside your university campus.",
    image: require("../../assets/images/onboarding/shop.png"),
  },
  {
    id: "2",
    titleStart: "Fast",
    titleBold: "Delivery",
    titleEnd: "To Your Doorstep",
    description: "Get your orders delivered to your hostel or lecture hall in minutes.",
    image: require("../../assets/images/onboarding/delivery.png"),
  },
  {
    id: "3",
    titleStart: "Secure",
    titleBold: "Payments",
    titleEnd: "With Zero Stress",
    description: "Pay securely via Mobile Money or your BexieMart wallet with ease.",
    image: require("../../assets/images/onboarding/payment.png"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      scrollViewRef.current?.scrollTo({ x: (currentIndex - 1) * width, animated: true });
    }
  };

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace("/(auth)/register");
  };

  const onMomentumScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="absolute top-14 left-0 right-0 flex-row justify-between items-center px-6 z-20">
        {currentIndex > 0 ? (
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center"
          >
            <ArrowLeft color="var(--color-primary)" size={20} />
          </TouchableOpacity>
        ) : (
          <View className="w-10 h-10" /> /* Spacer */
        )}

        <TouchableOpacity onPress={handleComplete}>
          <Text className="text-body-md font-bold text-primary font-body">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Invisible ScrollView to capture gestures */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        bounces={false}
        className="absolute inset-0 z-30"
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={{ width, height }} />
        ))}
      </Animated.ScrollView>

      {/* Fixed UI Layer underneath the invisible ScrollView */}
      <View className="flex-1 items-center pt-32 pb-[120px] px-6" pointerEvents="none">
        {/* Overlapping Cards Container */}
        <View className="relative w-[280px] h-[340px] items-center justify-center mb-8">
          {SLIDES.map((slide, index) => {
            const getInterpolationArrays = (i: number) => {
              if (i === 0) {
                return {
                  translateX: [0, -60, 60],
                  rotate: [0, -12, 12],
                  scale: [1, 0.9, 0.9],
                  opacity: [1, 0.4, 0.4],
                  zIndex: [3, 1, 2],
                };
              } else if (i === 1) {
                return {
                  translateX: [60, 0, -60],
                  rotate: [12, 0, -12],
                  scale: [0.9, 1, 0.9],
                  opacity: [0.4, 1, 0.4],
                  zIndex: [2, 3, 1],
                };
              } else {
                return {
                  translateX: [-60, 60, 0],
                  rotate: [-12, 12, 0],
                  scale: [0.9, 0.9, 1],
                  opacity: [0.4, 0.4, 1],
                  zIndex: [1, 2, 3],
                };
              }
            };

            const arrays = getInterpolationArrays(index);

            const cardStyle = useAnimatedStyle(() => {
              const tx = interpolate(
                scrollX.value,
                [0, width, width * 2],
                arrays.translateX,
                Extrapolation.CLAMP
              );
              const rot = interpolate(
                scrollX.value,
                [0, width, width * 2],
                arrays.rotate,
                Extrapolation.CLAMP
              );
              const sc = interpolate(
                scrollX.value,
                [0, width, width * 2],
                arrays.scale,
                Extrapolation.CLAMP
              );
              const op = interpolate(
                scrollX.value,
                [0, width, width * 2],
                arrays.opacity,
                Extrapolation.CLAMP
              );
              const zi = Math.round(
                interpolate(
                  scrollX.value,
                  [0, width, width * 2],
                  arrays.zIndex,
                  Extrapolation.CLAMP
                )
              );

              return {
                transform: [{ translateX: tx }, { rotate: `${rot}deg` }, { scale: sc }],
                opacity: op,
                zIndex: zi,
              };
            });

            return (
              <Animated.View
                key={slide.id}
                className="absolute w-[280px] h-[340px] rounded-[32px] overflow-hidden shadow-2xl shadow-none bg-primary-subtle"
                style={cardStyle}
              >
                <Image
                  source={slide.image}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </Animated.View>
            );
          })}
        </View>

        {/* Reimagined Pagination: Liquid Worm */}
        <View className="flex-row justify-center items-center mb-6 h-[24px]">
          <View className="flex-row gap-2 relative">
            {/* Background Dots */}
            {SLIDES.map((_, i) => (
              <View key={`dot-${i}`} className="w-2 h-2 rounded-full bg-primary-subtle" />
            ))}

            {/* The Animated Worm */}
            <Animated.View
              className="absolute left-0 top-0 h-2 bg-primary rounded-full"
              style={useAnimatedStyle(() => {
                const tx = interpolate(
                  scrollX.value,
                  [0, width * 0.5, width, width * 1.5, width * 2],
                  [0, 0, 16, 16, 32],
                  Extrapolation.CLAMP
                );

                const w = interpolate(
                  scrollX.value,
                  [0, width * 0.5, width, width * 1.5, width * 2],
                  [8, 24, 8, 24, 8],
                  Extrapolation.CLAMP
                );

                return {
                  transform: [{ translateX: tx }],
                  width: w,
                };
              })}
            />
          </View>
        </View>

        {/* Typography Container */}
        <View className="flex-1 w-full items-center justify-center">
          {SLIDES.map((slide, index) => {
            const textStyle = useAnimatedStyle(() => {
              const opacity = interpolate(
                scrollX.value,
                [(index - 1) * width, index * width, (index + 1) * width],
                [0, 1, 0],
                Extrapolation.CLAMP
              );

              const translateY = interpolate(
                scrollX.value,
                [(index - 1) * width, index * width, (index + 1) * width],
                [20, 0, -20],
                Extrapolation.CLAMP
              );

              return {
                opacity,
                transform: [{ translateY }],
                position: "absolute",
                left: 0,
                right: 0,
                alignItems: "center",
              };
            });

            return (
              <Animated.View key={`text-${slide.id}`} style={textStyle}>
                <Text className="text-[38px] font-heading text-center leading-[46px] text-muted-foreground mb-4">
                  {slide.titleStart}{" "}
                  <Text className="font-bold text-foreground">{slide.titleBold}</Text>
                  {"\n"}
                  {slide.titleEnd}
                </Text>

                <Text className="text-[18px] text-muted-foreground font-body text-center leading-[28px] px-4">
                  {slide.description}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Footer / Button (Needs z-40 so it's clickable above invisible ScrollView) */}
      <View className="absolute bottom-12 left-0 right-0 px-6 z-40">
        <Button
          title={currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
          size="lg"
          onPress={handleNext}
          className="rounded-full py-4 bg-primary"
          textClassName="text-lg font-bold text-white"
        />
      </View>
    </View>
  );
}
