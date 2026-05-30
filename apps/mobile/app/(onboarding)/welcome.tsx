import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";
import { Button } from "../../src/components/ui/Button";
import { useAuthStore } from "../../src/lib/stores/auth-store";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  // Animation values
  const sheetTranslateY = useSharedValue(500);
  const floatY = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Bring up the bottom sheet
    sheetTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 100 }));

    // Continuous floating animation for the logo
    floatY.value = withRepeat(
      withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Continuous subtle pulsing for the background rings
    pulseScale.value = withRepeat(
      withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.1], [0.15, 0.05]),
  }));

  const pulseStyleDelay = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * 1.2 }],
    opacity: interpolate(pulseScale.value, [1, 1.1], [0.1, 0.02]),
  }));

  const handleGetStarted = () => {
    // Navigate to the onboarding carousel (index.tsx)
    router.push("/(onboarding)");
  };

  const handleHaveAccount = async () => {
    // Skip onboarding and go to login
    await completeOnboarding();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-brand-600">
      {/* Top Half: Creative Logo Display */}
      <View className="flex-1 items-center justify-center relative pb-10">
        
        {/* Animated Background Rings */}
        <Animated.View style={pulseStyle} className="absolute w-[300px] h-[300px] rounded-full border border-white" />
        <Animated.View style={pulseStyleDelay} className="absolute w-[400px] h-[400px] rounded-full border border-white" />
        <Animated.View style={pulseStyle} className="absolute w-[500px] h-[500px] rounded-full border border-white" />

        {/* Floating 3D Logo Card */}
        <Animated.View style={floatStyle} className="items-center justify-center relative z-10">
          <View className="w-[140px] h-[140px] rounded-[40px] bg-white/10 items-center justify-center shadow-2xl overflow-hidden border border-white/20" style={{ transform: [{ rotate: '-10deg' }] }}>
            {/* Inner glass layer */}
            <View className="absolute inset-0 bg-white/20 rounded-[40px]" />
            <View className="w-[100px] h-[100px] rounded-[28px] bg-white items-center justify-center shadow-inner" style={{ transform: [{ rotate: '10deg' }] }}>
              <FontAwesome5 name="store" size={48} color="#004CFF" solid />
            </View>
          </View>
          
          {/* Sparkles/Accents */}
          <View className="absolute -top-4 -right-4 w-6 h-6 rounded-full bg-yellow-400 shadow-sm" />
          <View className="absolute bottom-4 -left-6 w-4 h-4 rounded-full bg-brand-200 shadow-sm" />
        </Animated.View>

      </View>

      {/* Bottom Half: White Sheet Content */}
      <Animated.View 
        style={sheetStyle} 
        className="bg-white rounded-t-[48px] px-8 pt-12 pb-16 w-full shadow-up"
      >
        <Text className="text-[36px] font-heading font-black text-foreground text-center leading-[42px] tracking-tight mb-4">
          Welcome to{"\n"}
          <Text className="text-brand-600">BexieMart</Text>
        </Text>
        
        <Text className="text-[16px] text-muted-foreground font-body text-center leading-[24px] px-2 mb-10">
          Your ultimate campus marketplace. Shop, order, and get deliveries instantly right to your hostel or lecture hall.
        </Text>

        <View className="gap-4 w-full">
          <Button
            title="Get Started"
            size="lg"
            onPress={handleGetStarted}
            className="w-full rounded-full py-4 shadow-md bg-brand-600"
            textClassName="text-lg font-bold text-white"
          />

          <TouchableOpacity onPress={handleHaveAccount} className="py-4 items-center">
            <Text className="text-[16px] font-bold text-brand-600 font-body">
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
