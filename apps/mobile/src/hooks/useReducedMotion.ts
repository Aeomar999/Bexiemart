import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Tracks the OS "reduce motion" accessibility setting (iOS: Reduce Motion,
 * Android: Remove animations). Components with decorative animation — pulses,
 * entrance springs, loops — should render their resting state when this is
 * true. Gesture-driven feedback that tracks the user's finger (e.g.
 * SwipeButton) is exempt per platform guidelines.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
