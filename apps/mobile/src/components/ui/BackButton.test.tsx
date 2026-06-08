import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { BackButton } from "./BackButton";

const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: any[]) => mockBack(...args),
    canGoBack: (...args: any[]) => mockCanGoBack(...args),
    push: (...args: any[]) => mockPush(...args),
  },
}));

describe("BackButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    expect(() => render(<BackButton />)).not.toThrow();
  });

  it("calls custom onPress when provided", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<BackButton onPress={onPress} />);
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls router.back when onPress not provided and canGoBack is true", () => {
    mockCanGoBack.mockReturnValue(true);
    const { getByRole } = render(<BackButton />);
    fireEvent.press(getByRole("button"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("calls router.push('/') when onPress not provided and canGoBack is false", () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByRole } = render(<BackButton />);
    fireEvent.press(getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
