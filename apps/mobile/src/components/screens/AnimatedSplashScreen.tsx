import React, { useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
  useReducedMotion,
} from "react-native-reanimated";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  // Ring pulses
  const ring1Scale = useSharedValue(0);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0);
  const ring2Opacity = useSharedValue(0);
  const ring3Scale = useSharedValue(0);
  const ring3Opacity = useSharedValue(0);

  // Logo
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoRotateZ = useSharedValue(-15);

  // Brand name letters
  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(30);

  // Tagline
  const taglineOpacity = useSharedValue(0);
  const taglineWidth = useSharedValue(0);

  // Whole screen fade-out
  const screenOpacity = useSharedValue(1);

  // Reanimated's hook reads the OS setting synchronously, so the reduced
  // branch can render the resting state on the very first frame.
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      // Skip the choreography: show the finished composition, hold briefly,
      // then crossfade out (fades are the accepted reduced-motion transition).
      logoOpacity.value = 1;
      logoScale.value = 1;
      logoRotateZ.value = 0;
      brandOpacity.value = 1;
      brandTranslateY.value = 0;
      taglineOpacity.value = 1;
      taglineWidth.value = 100;

      const timeout = setTimeout(() => {
        screenOpacity.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(onAnimationComplete)();
        });
      }, 1200);
      return () => clearTimeout(timeout);
    }

    // Phase 1: Logo entrance — scale + rotate in with spring
    logoOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120, mass: 0.8 });
    logoRotateZ.value = withSpring(0, { damping: 14, stiffness: 120, mass: 0.8 });

    // Phase 2: Pulse rings ripple outward sequentially
    ring1Opacity.value = withDelay(300, withTiming(0.15, { duration: 300 }));
    ring1Scale.value = withDelay(
      300,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    ring1Opacity.value = withDelay(
      300,
      withSequence(withTiming(0.15, { duration: 300 }), withTiming(0, { duration: 500 }))
    );

    ring2Opacity.value = withDelay(500, withTiming(0.1, { duration: 300 }));
    ring2Scale.value = withDelay(
      500,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    ring2Opacity.value = withDelay(
      500,
      withSequence(withTiming(0.1, { duration: 300 }), withTiming(0, { duration: 500 }))
    );

    ring3Opacity.value = withDelay(700, withTiming(0.06, { duration: 300 }));
    ring3Scale.value = withDelay(
      700,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    ring3Opacity.value = withDelay(
      700,
      withSequence(withTiming(0.06, { duration: 300 }), withTiming(0, { duration: 500 }))
    );

    // Phase 3: Brand name slides up
    brandOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    brandTranslateY.value = withDelay(600, withSpring(0, { damping: 16, stiffness: 100 }));

    // Phase 4: Tagline wipes in from left
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
    taglineWidth.value = withDelay(
      900,
      withTiming(100, { duration: 600, easing: Easing.out(Easing.ease) })
    );

    // Phase 5: Hold, then fade out the entire screen
    const timeout = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 400 }, () => {
        runOnJS(onAnimationComplete)();
      });
    }, 2400);

    return () => clearTimeout(timeout);
  }, []);

  // --- Animated Styles ---

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotateZ.value}deg` }],
  }));

  const ringStyle = (scale: SharedValue<number>, opacity: SharedValue<number>, size: number) =>
    useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
      width: size,
      height: size,
      borderRadius: size / 2,
    }));

  const ring1Style = ringStyle(ring1Scale, ring1Opacity, 180);
  const ring2Style = ringStyle(ring2Scale, ring2Opacity, 260);
  const ring3Style = ringStyle(ring3Scale, ring3Opacity, 340);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const taglineClipStyle = useAnimatedStyle(() => ({
    width: `${taglineWidth.value}%`,
    overflow: "hidden" as const,
  }));

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: "white" }, screenStyle]}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* Pulse Rings */}
        <Animated.View style={[ring3Style, { position: "absolute", backgroundColor: "#06406b" }]} />
        <Animated.View style={[ring2Style, { position: "absolute", backgroundColor: "#06406b" }]} />
        <Animated.View style={[ring1Style, { position: "absolute", backgroundColor: "#06406b" }]} />

        {/* Logo Icon */}
        <Animated.View style={logoStyle}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              backgroundColor: "#06406b",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#06406b",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.35,
              shadowRadius: 24,
              elevation: 16,
            }}
          >
            <FontAwesome5 name="store" size={42} color="#FFFFFF" solid />
          </View>
        </Animated.View>

        {/* Brand Name */}
        <Animated.View style={[brandStyle, { marginTop: 28, alignItems: "center" }]}>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "800",
              color: "#0a0a0a",
              letterSpacing: -0.5,
              fontFamily: "Raleway_700Bold",
            }}
          >
            Bexie<Text style={{ color: "#06406b" }}>Mart</Text>
          </Text>
        </Animated.View>

        {/* Tagline with wipe-in effect */}
        <Animated.View style={[taglineStyle, { marginTop: 8, alignItems: "center" }]}>
          <Animated.View style={taglineClipStyle}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 16,
                color: "#9ca3af",
                fontFamily: "Nunito_500Medium",
                textAlign: "center",
                width: SCREEN_WIDTH * 0.6,
              }}
            >
              Shop smart on campus
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
