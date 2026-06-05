import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 20, borderRadius = 4, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#E2E8F0", // Slate 200
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <Animated.View
      className="bg-card rounded-[24px] overflow-hidden border border-border"
      style={{ width: "48%", marginBottom: 16 }}
    >
      <Skeleton width="100%" height={160} borderRadius={0} />
      <Animated.View className="p-3">
        <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={12} style={{ marginBottom: 12 }} />
        <Skeleton width={80} height={18} borderRadius={12} />
      </Animated.View>
    </Animated.View>
  );
}

export function CartItemSkeleton() {
  return (
    <Animated.View className="flex-row bg-card rounded-[24px] p-4 border border-border gap-3 mb-3 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
      <Skeleton width={22} height={22} borderRadius={6} />
      <Skeleton width={84} height={84} borderRadius={16} />
      <Animated.View className="flex-1 py-1 justify-between">
        <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={14} style={{ marginBottom: 12 }} />
        <Animated.View className="flex-row justify-between items-center mt-2">
          <Skeleton width={60} height={18} borderRadius={4} />
          <Skeleton width={80} height={32} borderRadius={16} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}
