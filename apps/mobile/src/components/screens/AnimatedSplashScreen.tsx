import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  runOnJS,
  Easing,
} from "react-native-reanimated";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  
  // Ripple animation values
  const rippleScale1 = useSharedValue(0.5);
  const rippleOpacity1 = useSharedValue(0);
  const rippleScale2 = useSharedValue(0.5);
  const rippleOpacity2 = useSharedValue(0);

  useEffect(() => {
    // 1. Spring in the main logo
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 100 });

    // 2. Start continuous subtle ripples behind the logo
    rippleOpacity1.value = withDelay(300, withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));
    rippleScale1.value = withDelay(300, withRepeat(withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));
    
    // Set initial opacity for the repeat animation
    setTimeout(() => { rippleOpacity1.value = 0.4; }, 300);

    rippleOpacity2.value = withDelay(1300, withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));
    rippleScale2.value = withDelay(1300, withRepeat(withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));
    
    setTimeout(() => { rippleOpacity2.value = 0.4; }, 1300);

    // 3. Slide up text
    textOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(
      600,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.5)) })
    );

    // 4. Complete after a few seconds
    const timeout = setTimeout(() => {
      logoOpacity.value = withTiming(0, { duration: 400 });
      textOpacity.value = withTiming(0, { duration: 400 });
      rippleOpacity1.value = 0;
      rippleOpacity2.value = 0;
      setTimeout(() => {
        runOnJS(onAnimationComplete)();
      }, 400);
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const rippleStyle1 = useAnimatedStyle(() => ({
    opacity: rippleOpacity1.value,
    transform: [{ scale: rippleScale1.value }],
  }));

  const rippleStyle2 = useAnimatedStyle(() => ({
    opacity: rippleOpacity2.value,
    transform: [{ scale: rippleScale2.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} className="bg-brand-600 items-center justify-center">
      
      {/* Animated Center Logo & Ripples */}
      <View className="items-center justify-center mb-10 h-32 w-32 relative">
        {/* Ripples */}
        <Animated.View style={rippleStyle1} className="absolute w-24 h-24 rounded-full bg-white/20" />
        <Animated.View style={rippleStyle2} className="absolute w-24 h-24 rounded-full bg-white/20" />
        
        {/* Main Logo Card */}
        <Animated.View style={logoStyle} className="items-center justify-center relative z-10">
          <View className="w-[100px] h-[100px] rounded-[32px] bg-white items-center justify-center shadow-2xl shadow-black/40">
            <FontAwesome5 name="store" size={46} color="#004CFF" solid />
          </View>
        </Animated.View>
      </View>

      {/* Typography */}
      <Animated.View style={textStyle} className="items-center mt-4">
        <Text className="text-[40px] font-heading font-black text-white tracking-tight mb-2">
          BexieMart
        </Text>
        <Text className="text-[18px] text-brand-100 font-body tracking-wider">
          Shop smart on campus
        </Text>
      </Animated.View>
    </View>
  );
}
