import React, { useRef, useState, useEffect } from "react";
import { View, Text, Animated, PanResponder, StyleSheet, Dimensions } from "react-native";
import { Icon } from "./Icon";

interface SwipeButtonProps {
  onComplete: () => void;
  text: string;
  buttonColor?: string;
  sliderColor?: string;
  iconName?: string;
  resetOnComplete?: boolean;
}

export const SwipeButton: React.FC<SwipeButtonProps> = ({
  onComplete,
  text,
  buttonColor = "var(--color-primary)",
  sliderColor = "#FFFFFF",
  iconName = "chevron-right",
  resetOnComplete = true,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const sliderWidth = 56;
  const pan = useRef(new Animated.ValueXY()).current;
  const [isCompleted, setIsCompleted] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (isCompleted) return;

        let newX = gestureState.dx;
        const maxX = containerWidth - sliderWidth - 8; // 8 for padding

        if (newX < 0) newX = 0;
        if (newX > maxX) newX = maxX;

        pan.setValue({ x: newX, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isCompleted) return;

        const maxX = containerWidth - sliderWidth - 8;

        if (gestureState.dx >= maxX * 0.9) {
          // Completed!
          Animated.spring(pan, {
            toValue: { x: maxX, y: 0 },
            useNativeDriver: false,
            bounciness: 0,
          }).start();

          setIsCompleted(true);
          onComplete();

          if (resetOnComplete) {
            setTimeout(() => {
              setIsCompleted(false);
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
              }).start();
            }, 1000);
          }
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            bounciness: 10,
          }).start();
        }
      },
    })
  ).current;

  // The colored background fills up behind the slider
  const fillWidth = pan.x.interpolate({
    inputRange: [0, Math.max(1, containerWidth - sliderWidth - 8)],
    outputRange: [sliderWidth, containerWidth - 8],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[styles.container, { backgroundColor: buttonColor + "20" }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Text style={[styles.text, { color: buttonColor }]}>{text}</Text>

      <Animated.View
        style={[styles.fill, { width: fillWidth, backgroundColor: buttonColor + "40" }]}
      />

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.slider,
          { backgroundColor: sliderColor, transform: [{ translateX: pan.x }] },
        ]}
      >
        <Icon name={isCompleted ? "check" : iconName} size={24} color={buttonColor} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    padding: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    position: "absolute",
    zIndex: 1,
  },
  fill: {
    position: "absolute",
    left: 4,
    height: 56,
    borderRadius: 28,
    zIndex: 2,
  },
  slider: {
    height: 56,
    width: 56,
    borderRadius: 28,
    position: "absolute",
    left: 4,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
