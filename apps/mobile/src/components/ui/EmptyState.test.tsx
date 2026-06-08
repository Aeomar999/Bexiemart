import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    const { getByText } = render(
      <EmptyState title="No items" description="Your cart is empty" />
    );
    expect(getByText("No items")).toBeTruthy();
    expect(getByText("Your cart is empty")).toBeTruthy();
  });

  it("renders action button when actionLabel and onAction provided", () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState title="Empty" description="Nothing here" actionLabel="Go Back" onAction={onAction} />
    );
    expect(getByText("Go Back")).toBeTruthy();
    fireEvent.press(getByText("Go Back"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not render action button when onAction is missing", () => {
    const { queryByText } = render(
      <EmptyState title="Empty" description="Nothing here" actionLabel="Go Back" />
    );
    expect(queryByText("Go Back")).toBeNull();
  });
});
