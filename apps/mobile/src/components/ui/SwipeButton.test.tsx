import React from "react";
import { render } from "@testing-library/react-native";
import { SwipeButton } from "./SwipeButton";

describe("SwipeButton", () => {
  it("renders with default text", () => {
    const { getByText } = render(<SwipeButton onComplete={() => {}} text="Swipe to confirm" />);
    expect(getByText("Swipe to confirm")).toBeTruthy();
  });

  it("renders with custom colors", () => {
    expect(() =>
      render(<SwipeButton onComplete={() => {}} text="Pay Now" buttonColor="#10B981" />)
    ).not.toThrow();
  });
});
