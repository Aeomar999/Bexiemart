import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Platform } from "react-native";
import { usePopupStore } from "@/lib/stores/popup-store";
import { tokens } from "@/theme/tokens";
import { Icon } from "./Icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function GlobalPopup() {
  const { isVisible, type, title, message, action, hidePopup } = usePopupStore();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [renderComponent, setRenderComponent] = useState(isVisible);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (isVisible) {
      setRenderComponent(true);
      if (reducedMotion) {
        opacity.setValue(1);
        translateY.setValue(0);
      } else {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 65,
            useNativeDriver: true,
          }),
        ]).start();
      }

      const timer = setTimeout(
        () => {
          closeModal();
        },
        action ? 6000 : 4000
      );
      return () => clearTimeout(timer);
    } else if (reducedMotion) {
      opacity.setValue(0);
      translateY.setValue(100);
      setRenderComponent(false);
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 100,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => setRenderComponent(false));
    }
  }, [isVisible]);

  const closeModal = () => {
    if (reducedMotion) {
      opacity.setValue(0);
      translateY.setValue(100);
      hidePopup();
      setRenderComponent(false);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 100,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hidePopup();
      setRenderComponent(false);
    });
  };

  if (!renderComponent && !isVisible) return null;

  const getIconProps = () => {
    switch (type) {
      case "success":
        return {
          name: "check-circle",
          color: tokens.success,
          bgColor: "#ECFDF5",
          borderColor: "#A7F3D0",
        };
      case "error":
        return {
          name: "alert-circle",
          color: tokens.error,
          bgColor: "#FEF2F2",
          borderColor: "#FECACA",
        };
      case "info":
        return {
          name: "info",
          color: tokens.secondary,
          bgColor: "#EFF6FF",
          borderColor: "#BFDBFE",
        };
      default:
        return {
          name: "check-circle",
          color: tokens.success,
          bgColor: "#ECFDF5",
          borderColor: "#A7F3D0",
        };
    }
  };

  const styleProps = getIconProps();

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + (Platform.OS === "ios" ? 20 : 30),
        left: 20,
        right: 20,
        zIndex: 9999,
        elevation: 9999,
        alignItems: "center",
        maxWidth: 400,
        alignSelf: "center",
      }}
      pointerEvents="box-none"
    >
      <Animated.View
        style={{
          width: "100%",
          backgroundColor: tokens.primaryText,
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          opacity: opacity,
          transform: [{ translateY }],
          borderWidth: 1,
          borderColor: "#E2E8F0",
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: styleProps.bgColor,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
            borderWidth: 1,
            borderColor: styleProps.borderColor,
          }}
        >
          <Icon name={styleProps.name as any} size={20} color={styleProps.color} />
        </View>

        {/* Text Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              color: tokens.textPrimary,
              fontFamily: "Nunito_700Bold",
              marginBottom: message ? 2 : 0,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {message ? (
            <Text
              style={{
                fontSize: 13,
                color: tokens.textMuted,
                fontFamily: "Nunito_500Medium",
              }}
              numberOfLines={2}
            >
              {message}
            </Text>
          ) : null}
        </View>

        {/* Close Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={closeModal}
          style={{ padding: 8, marginLeft: 4 }}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="x" size={18} color={tokens.textMuted} />
        </Pressable>
      </Animated.View>

      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={() => {
            hidePopup();
            action.onPress();
          }}
          className="mt-3 self-end bg-primary rounded-full px-5 py-2"
        >
          <Text style={{ color: tokens.primaryText, fontFamily: "Nunito_700Bold", fontSize: 13 }}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
