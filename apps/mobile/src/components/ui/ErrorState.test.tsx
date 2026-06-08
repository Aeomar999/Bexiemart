import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("renders default title and message", () => {
    const { getByText } = render(<ErrorState />);
    expect(getByText("Something went wrong")).toBeTruthy();
    expect(getByText("We couldn't load this data. Please try again.")).toBeTruthy();
  });

  it("renders custom title and message", () => {
    const { getByText } = render(<ErrorState title="Oops!" message="Custom error" />);
    expect(getByText("Oops!")).toBeTruthy();
    expect(getByText("Custom error")).toBeTruthy();
  });

  it("renders retry button and calls onRetry", () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorState onRetry={onRetry} />);
    expect(getByText("Try Again")).toBeTruthy();
    fireEvent.press(getByText("Try Again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render retry button when onRetry is missing", () => {
    const { queryByText } = render(<ErrorState />);
    expect(queryByText("Try Again")).toBeNull();
  });
});
