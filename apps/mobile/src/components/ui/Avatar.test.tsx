import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("renders with uri", () => {
    expect(() => render(<Avatar uri="https://example.com/photo.jpg" />)).not.toThrow();
  });

  it("renders initials fallback when no uri", () => {
    const { getByText } = render(<Avatar name="John" />);
    expect(getByText("J")).toBeTruthy();
  });

  it("renders question mark fallback when no uri and no name", () => {
    const { getByText } = render(<Avatar />);
    expect(getByText("?")).toBeTruthy();
  });

  it("renders icon fallback when fallback='icon'", () => {
    expect(() => render(<Avatar fallback="icon" iconName="user" />)).not.toThrow();
  });

  it("renders dicebear fallback when fallback='dicebear'", () => {
    expect(() => render(<Avatar name="John" fallback="dicebear" />)).not.toThrow();
  });

  it("renders editable overlay when editable is true", () => {
    expect(() => render(<Avatar editable />)).not.toThrow();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Avatar name="John" onPress={onPress} />);
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
