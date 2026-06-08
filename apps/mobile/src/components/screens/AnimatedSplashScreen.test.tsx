import React from "react";
import { render, act } from "@testing-library/react-native";
import { AnimatedSplashScreen } from "./AnimatedSplashScreen";

jest.mock("react-native-reanimated", () => {
  const mockAnimatedView = (props: any) => props.children ?? null;
  mockAnimatedView.displayName = "Animated.View";
  return {
    __esModule: true,
    default: { View: mockAnimatedView, createAnimatedComponent: (component: any) => component },
    useSharedValue: (init: any) => ({ value: init }),
    useAnimatedStyle: (fn: any) => fn ? {} : {},
    withTiming: (val: any, _opts: any, cb: any) => {
      if (typeof cb === "function") cb();
      return val;
    },
    withSpring: (val: any) => val,
    withDelay: (_: any, val: any) => val,
    withSequence: (...vals: any[]) => vals[vals.length - 1],
    runOnJS: (fn: any) => fn,
    Easing: { out: () => {}, in: () => {}, ease: "ease" },
    interpolate: (val: any, input: any[], output: any[]) => output[0],
    Extrapolation: { CLAMP: "clamp" },
  };
});

describe("AnimatedSplashScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders logo and brand name", () => {
    const onComplete = jest.fn();
    const { getByText } = render(<AnimatedSplashScreen onAnimationComplete={onComplete} />);
    expect(getByText("Shop smart on campus")).toBeTruthy();
  });

  it("calls onAnimationComplete after timeout", () => {
    const onComplete = jest.fn();
    render(<AnimatedSplashScreen onAnimationComplete={onComplete} />);
    act(() => { jest.advanceTimersByTime(2800); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
