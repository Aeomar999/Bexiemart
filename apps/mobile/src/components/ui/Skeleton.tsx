import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, DimensionValue } from "react-native";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
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
          width: width as any,
          height: height as any,
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

export function ListSkeleton() {
  return (
    <Animated.View className="w-full flex-1 p-4 bg-background">
      {[1, 2, 3, 4, 5].map((key) => (
        <Animated.View
          key={key}
          className="flex-row items-center p-4 mb-4 bg-card rounded-[24px] border border-border"
        >
          <Skeleton width={50} height={50} borderRadius={25} style={{ marginRight: 16 }} />
          <Animated.View className="flex-1">
            <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={14} />
          </Animated.View>
        </Animated.View>
      ))}
    </Animated.View>
  );
}

export function DetailSkeleton() {
  return (
    <Animated.View className="w-full flex-1 bg-background">
      <Skeleton width="100%" height={250} borderRadius={0} style={{ marginBottom: 20 }} />
      <Animated.View className="px-4">
        <Skeleton width="70%" height={24} style={{ marginBottom: 12 }} />
        <Skeleton width="40%" height={16} style={{ marginBottom: 24 }} />

        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={14} style={{ marginBottom: 24 }} />

        <Skeleton width="100%" height={50} borderRadius={16} />
      </Animated.View>
    </Animated.View>
  );
}

export function ProfileSkeleton() {
  return (
    <Animated.View className="w-full flex-1 p-4 bg-background items-center pt-8">
      <Skeleton width={100} height={100} borderRadius={50} style={{ marginBottom: 24 }} />
      <Skeleton width="50%" height={20} style={{ marginBottom: 32 }} />

      <Animated.View className="w-full">
        <Skeleton width="100%" height={60} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={60} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={60} borderRadius={16} style={{ marginBottom: 16 }} />
      </Animated.View>
    </Animated.View>
  );
}
