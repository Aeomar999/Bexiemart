import React from "react";
import { render, act } from "@testing-library/react-native";
import { Animated } from "react-native";
import { GlobalPopup } from "./GlobalPopup";
import type { PopupState } from "@/lib/stores/popup-store";

const mockHidePopup = jest.fn();
const mockShowPopup = jest.fn();

const makePopup = (overrides: Partial<PopupState>): PopupState => ({
  isVisible: false,
  type: "success",
  title: "",
  message: "",
  showPopup: mockShowPopup,
  hidePopup: mockHidePopup,
  ...overrides,
});

const mockUsePopupStore = jest.fn((): PopupState => makePopup({}));

jest.mock("@/lib/stores/popup-store", () => ({
  usePopupStore: () => mockUsePopupStore(),
}));

describe("GlobalPopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(Animated, "parallel").mockImplementation(
      () =>
        ({
          start: (cb?: (result?: { finished: boolean }) => void) => {
            cb?.({ finished: true });
          },
          stop: jest.fn(),
          reset: jest.fn(),
        }) as unknown as ReturnType<typeof Animated.parallel>
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("returns null when not visible", () => {
    mockUsePopupStore.mockReturnValue(makePopup({ isVisible: false }));
    const { UNSAFE_root } = render(<GlobalPopup />);
    expect(UNSAFE_root.children.length).toBe(0);
  });

  it("renders popup when visible", () => {
    mockUsePopupStore.mockReturnValue(
      makePopup({ isVisible: true, title: "Success!", message: "Operation completed" })
    );
    const { getByText } = render(<GlobalPopup />);
    expect(getByText("Success!")).toBeTruthy();
    expect(getByText("Operation completed")).toBeTruthy();
  });

  it("renders error type popup", () => {
    mockUsePopupStore.mockReturnValue(
      makePopup({ isVisible: true, type: "error", title: "Error", message: "Something failed" })
    );
    const { getByText } = render(<GlobalPopup />);
    expect(getByText("Error")).toBeTruthy();
  });

  it("renders info type popup", () => {
    mockUsePopupStore.mockReturnValue(makePopup({ isVisible: true, type: "info", title: "Info" }));
    const { getByText } = render(<GlobalPopup />);
    expect(getByText("Info")).toBeTruthy();
  });

  it("auto-hides after 4 seconds", () => {
    mockUsePopupStore.mockReturnValue(makePopup({ isVisible: true, title: "Auto Hide" }));
    render(<GlobalPopup />);
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(mockHidePopup).toHaveBeenCalled();
  });
});
