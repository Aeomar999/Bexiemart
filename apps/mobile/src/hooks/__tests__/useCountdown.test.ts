import { renderHook, act } from "@testing-library/react-native";
import { useCountdown } from "../useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T10:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should calculate time left correctly", () => {
    const targetDate = new Date("2026-01-01T12:30:15Z"); // 2 hours, 30 minutes, 15 seconds later
    const { result } = renderHook(() => useCountdown(targetDate));

    expect(result.current).toEqual({
      hours: "02",
      minutes: "30",
      seconds: "15",
    });
  });

  it("should update time left after 1 second", () => {
    const targetDate = new Date("2026-01-01T10:00:05Z"); // 5 seconds later
    const { result } = renderHook(() => useCountdown(targetDate));

    expect(result.current).toEqual({ hours: "00", minutes: "00", seconds: "05" });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toEqual({ hours: "00", minutes: "00", seconds: "04" });
  });

  it("should return 00:00:00 if target date is in the past", () => {
    const targetDate = new Date("2025-12-31T10:00:00Z");
    const { result } = renderHook(() => useCountdown(targetDate));

    expect(result.current).toEqual({
      hours: "00",
      minutes: "00",
      seconds: "00",
    });
  });

  it("should clear interval on unmount", () => {
    const targetDate = new Date("2026-01-01T10:00:10Z");
    const { unmount } = renderHook(() => useCountdown(targetDate));

    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
