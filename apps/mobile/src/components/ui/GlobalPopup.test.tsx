import React from "react";
import { render, act } from "@testing-library/react-native";
import { Animated } from "react-native";
import { GlobalPopup } from "./GlobalPopup";

const mockHidePopup = jest.fn();
const mockUsePopupStore = jest.fn(() => ({
  isVisible: false,
  type: "success",
  title: "",
  message: "",
  hidePopup: mockHidePopup,
}));

jest.mock("@/lib/stores/popup-store", () => ({
  usePopupStore: () => mockUsePopupStore(),
}));

describe("GlobalPopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(Animated, "parallel").mockImplementation(() => ({
      start: (cb?: (result?: { finished: boolean }) => void) => {
        cb?.({ finished: true });
      },
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("returns null when not visible", () => {
    mockUsePopupStore.mockReturnValue({
      isVisible: false,
      type: "success",
      title: "",
      message: "",
      hidePopup: mockHidePopup,
    });
    const { UNSAFE_root } = render(<GlobalPopup />);
    expect(UNSAFE_root.children.length).toBe(0);
  });

  it("renders popup when visible", () => {
    mockUsePopupStore.mockReturnValue({
      isVisible: true,
      type: "success",
      title: "Success!",
      message: "Operation completed",
      hidePopup: mockHidePopup,
    });
    const { getByText } = render(<GlobalPopup />);
    expect(getByText("Success!")).toBeTruthy();
    expect(getByText("Operation completed")).toBeTruthy();
  });

  it("renders error type popup", () => {
    mockUsePopupStore.mockReturnValue({
      isVisible: true,
      type: "error",
      title: "Error",
      message: "Something failed",
      hidePopup: mockHidePopup,
    });
    const { getByText } = render(<GlobalPopup />);
    expect(getByText("Error")).toBeTruthy();
  });

  it("renders info type popup", () => {
    mockUsePopupStore.mockReturnValue({
      isVisible: true,
      type: "info",
      title: "Info",
      hidePopup: mockHidePopup,
    });
    const { getByText } = render(<GlobalPopup />);
    expect(getByText("Info")).toBeTruthy();
  });

  it("auto-hides after 4 seconds", () => {
    mockUsePopupStore.mockReturnValue({
      isVisible: true,
      type: "success",
      title: "Auto Hide",
      hidePopup: mockHidePopup,
    });
    render(<GlobalPopup />);
    act(() => { jest.advanceTimersByTime(4000); });
    expect(mockHidePopup).toHaveBeenCalled();
  });
});
