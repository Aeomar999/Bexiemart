import React, { useRef, useState } from "react";
import { View, Text, Dimensions, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  interpolateColor,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { Button } from "../../src/components/ui/Button";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Shop Campus",
    subtitle: "Without The Hassle",
    description: "Discover the best products from vendors right inside your university campus.",
    image: require("../../assets/images/onboarding/shop.png"),
    color: "#EBF0FF", // brand-50
  },
  {
    id: "2",
    title: "Fast Delivery",
    subtitle: "To Your Doorstep",
    description: "Get your orders delivered to your hostel or lecture hall in minutes.",
    image: require("../../assets/images/onboarding/delivery.png"),
    color: "#E6F9F3", // success-light
  },
  {
    id: "3",
    title: "Secure Payments",
    subtitle: "With Zero Stress",
    description: "Pay securely via Mobile Money or your BexieMart wallet with ease.",
    image: require("../../assets/images/onboarding/payment.png"),
    color: "#FFFBEB", // warning-light
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

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace("/(auth)/login");
  };

  const onMomentumScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Top Header Actions */}
      <View className="absolute top-14 left-0 right-0 flex-row justify-end items-center px-6 z-20">
        <TouchableOpacity onPress={handleComplete} className="bg-white/50 px-4 py-2 rounded-full">
          <Text className="text-body-sm font-bold text-surface-600 font-body">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Top Section: Scrollable Images with Animated Background */}
      <View style={{ height: height * 0.6 }}>
        {/* Animated Background Color */}
        <Animated.View 
          className="absolute inset-0"
          style={useAnimatedStyle(() => {
            const backgroundColor = interpolateColor(
              scrollX.value,
              SLIDES.map((_, i) => i * width),
              SLIDES.map(s => s.color)
            );
            return { backgroundColor };
          })}
        />
        
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          bounces={false}
          className="flex-1"
        >
          {SLIDES.map((slide, index) => {
            const imageStyle = useAnimatedStyle(() => {
              const scale = interpolate(
                scrollX.value,
                [(index - 1) * width, index * width, (index + 1) * width],
                [0.8, 1, 0.8],
                Extrapolation.CLAMP
              );
              return { transform: [{ scale }] };
            });

            return (
              <View key={slide.id} style={{ width, height: height * 0.6 }} className="items-center justify-center pt-10">
                <Animated.View style={imageStyle} className="w-[85%] h-[85%]">
                  <Image source={slide.image} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                </Animated.View>
              </View>
            );
          })}
        </Animated.ScrollView>
      </View>

      {/* Bottom Section: Content Sheet */}
      <View 
        className="bg-white rounded-t-[40px] px-8 pb-12 pt-8 shadow-up absolute bottom-0 left-0 right-0"
        style={{ height: height * 0.45 }}
      >
        {/* Expanding Pill Pagination */}
        <View className="flex-row justify-center items-center h-2 mb-2 gap-2">
          {SLIDES.map((_, index) => {
            const dotStyle = useAnimatedStyle(() => {
              const dotWidth = interpolate(
                scrollX.value,
                [(index - 1) * width, index * width, (index + 1) * width],
                [8, 24, 8],
                Extrapolation.CLAMP
              );
              const opacity = interpolate(
                scrollX.value,
                [(index - 1) * width, index * width, (index + 1) * width],
                [0.3, 1, 0.3],
                Extrapolation.CLAMP
              );
              return { width: dotWidth, opacity };
            });

            return (
              <Animated.View
                key={index}
                className="h-2 rounded-full bg-brand-600"
                style={dotStyle}
              />
            );
          })}
        </View>

        {/* Text Container: Vertically Centered */}
        <View className="flex-1 justify-center items-center relative overflow-hidden">
          {SLIDES.map((slide, index) => {
            const textStyle = useAnimatedStyle(() => {
              const opacity = interpolate(
                scrollX.value,
                [(index - 0.5) * width, index * width, (index + 0.5) * width],
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
                position: 'absolute',
                width: '100%',
              };
            });

            return (
              <Animated.View key={`text-${index}`} style={textStyle} className="items-center">
                <Text className="text-[28px] font-heading font-black text-foreground text-center mb-1">
                  {slide.title}
                </Text>
                <Text className="text-[24px] font-heading font-bold text-brand-600 text-center mb-4">
                  {slide.subtitle}
                </Text>
                <Text className="text-[16px] font-body text-surface-500 text-center leading-[24px]">
                  {slide.description}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Bottom Button */}
        <View className="w-full mt-4">
          <Button
            title={currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
            size="lg"
            onPress={handleNext}
            className="w-full rounded-full py-4 shadow-md bg-brand-600"
            textClassName="text-[18px] font-bold text-white font-heading"
          />
        </View>
      </View>
    </View>
  );
}
