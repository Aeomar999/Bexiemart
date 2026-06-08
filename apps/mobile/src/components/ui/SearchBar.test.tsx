import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SearchBar } from "./SearchBar";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders default placeholder", () => {
    const { getByText } = render(<SearchBar />);
    expect(getByText("Search Bexiemart...")).toBeTruthy();
  });

  it("renders custom placeholder", () => {
    const { getByText } = render(<SearchBar placeholder="Find products..." />);
    expect(getByText("Find products...")).toBeTruthy();
  });

  it("calls onPress when provided", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<SearchBar onPress={onPress} />);
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("navigates to search when onPress not provided", () => {
    const { getByRole } = render(<SearchBar />);
    fireEvent.press(getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/(customer)/search");
  });
});
