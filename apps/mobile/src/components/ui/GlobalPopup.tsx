import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { usePopupStore } from '@/lib/stores/popup-store';
import { Icon } from './Icon';

export function GlobalPopup() {
  const { isVisible, type, title, message, hidePopup } = usePopupStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [renderComponent, setRenderComponent] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setRenderComponent(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        closeModal();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setRenderComponent(false));
      scaleAnim.setValue(0.9);
    }
  }, [isVisible]);

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      hidePopup();
      setRenderComponent(false);
    });
  };

  if (!renderComponent && !isVisible) return null;

  const getIconProps = () => {
    switch (type) {
      case 'success': return { name: 'check', bgColor: '#0369a1' }; // Match the deep blue from design
      case 'error': return { name: 'x', bgColor: '#ef4444' };
      case 'info': return { name: 'info', bgColor: '#3b82f6' };
      default: return { name: 'check', bgColor: '#0369a1' };
    }
  };

  const iconProps = getIconProps();

  return (
    <Animated.View 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        elevation: 9999,
        backgroundColor: 'rgba(23, 23, 23, 0.8)', // Dark overlay
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        opacity: fadeAnim,
      }}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <Animated.View 
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 24,
          paddingTop: 56, // Space for the overlapping circle
          paddingBottom: 32,
          paddingHorizontal: 24,
          alignItems: 'center',
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Overlapping White Circle Background */}
        <View 
          style={{
            position: 'absolute',
            top: -44,
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          {/* Inner Colored Circle */}
          <View 
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: iconProps.bgColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name={iconProps.name as any} size={24} color="#ffffff" />
          </View>
        </View>

        {/* Close (X) Button */}
        <Pressable 
          onPress={closeModal}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="x" size={24} color="#0f172a" />
        </Pressable>

        {/* Title & Message */}
        <Text style={{ 
          fontSize: 24, 
          color: '#1e293b',
          textAlign: 'center',
          marginBottom: 16,
          fontFamily: 'Raleway_700Bold' 
        }}>
          {title}
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#0f172a',
          textAlign: 'center',
          lineHeight: 24,
          fontFamily: 'Nunito_500Medium'
        }}>
          {message}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
