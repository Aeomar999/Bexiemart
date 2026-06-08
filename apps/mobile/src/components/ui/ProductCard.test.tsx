import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ProductCard } from "./ProductCard";

const baseProps = {
  id: "1",
  name: "Test Product",
  price: 49.99,
};

describe("ProductCard", () => {
  it("renders vertical variant by default", () => {
    const { getByText } = render(<ProductCard {...baseProps} />);
    expect(getByText("Test Product")).toBeTruthy();
    expect(getByText(/GHS 49.99/)).toBeTruthy();
  });

  it("renders horizontal variant", () => {
    const { getByText } = render(<ProductCard {...baseProps} variant="horizontal" />);
    expect(getByText("Test Product")).toBeTruthy();
  });

  it("renders compact variant", () => {
    const { getByText } = render(<ProductCard {...baseProps} variant="compact" />);
    expect(getByText(/GHS 50/)).toBeTruthy();
  });

  it("renders old price when provided", () => {
    const { getByText } = render(<ProductCard {...baseProps} oldPrice={69.99} />);
    expect(getByText(/GHS 69.99/)).toBeTruthy();
  });

  it("renders rating when provided", () => {
    const { getByText } = render(<ProductCard {...baseProps} rating={4.5} variant="horizontal" />);
    expect(getByText("4.5")).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    const { getByText } = render(<ProductCard {...baseProps} subtitle="Best seller" />);
    expect(getByText("Best seller")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<ProductCard {...baseProps} onPress={onPress} />);
    fireEvent.press(getByText("Test Product"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onFavoriteToggle when favorite button pressed", () => {
    const onFavoriteToggle = jest.fn();
    const { getAllByRole } = render(
      <ProductCard {...baseProps} isFavorite onFavoriteToggle={onFavoriteToggle} variant="horizontal" />
    );
    const buttons = getAllByRole("button");
    fireEvent.press(buttons[buttons.length - 1]);
    expect(onFavoriteToggle).toHaveBeenCalledTimes(1);
  });
});
