import { renderHook, waitFor, act } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { useReducedMotion } from "../useReducedMotion";

describe("useReducedMotion", () => {
  let changeListener: ((value: boolean) => void) | undefined;
  const remove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    changeListener = undefined;
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(((
      event: string,
      handler: (value: boolean) => void
    ) => {
      if (event === "reduceMotionChanged") changeListener = handler;
      return { remove } as any;
    }) as any);
  });

  it("defaults to false", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("reads the initial OS setting", async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("updates when the OS setting changes", async () => {
    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(changeListener).toBeDefined());
    act(() => changeListener!(true));
    expect(result.current).toBe(true);
  });

  it("unsubscribes on unmount", async () => {
    const { unmount } = renderHook(() => useReducedMotion());
    await waitFor(() => expect(changeListener).toBeDefined());
    unmount();
    expect(remove).toHaveBeenCalled();
  });
});
