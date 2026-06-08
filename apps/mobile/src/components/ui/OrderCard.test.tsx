import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { OrderCard } from "./OrderCard";

const baseOrder = {
  id: "ORD-123",
  date: "2024-01-15",
  status: "processing" as const,
  total: 129.99,
  items: [{ name: "Item A", qty: 2 }, { name: "Item B", qty: 1 }],
};

describe("OrderCard", () => {
  it("renders order details", () => {
    const { getByText } = render(<OrderCard {...baseOrder} />);
    expect(getByText("Order #ORD-123")).toBeTruthy();
    expect(getByText("2024-01-15")).toBeTruthy();
    expect(getByText("2x Item A")).toBeTruthy();
    expect(getByText("1x Item B")).toBeTruthy();
    expect(getByText(/GHS 129.99/)).toBeTruthy();
  });

  it("renders status label", () => {
    const { getByText } = render(<OrderCard {...baseOrder} />);
    expect(getByText("Processing")).toBeTruthy();
  });

  it("renders different statuses", () => {
    const shipped = { ...baseOrder, status: "shipped" as const };
    const { getByText: get1 } = render(<OrderCard {...shipped} />);
    expect(get1("Shipped")).toBeTruthy();
  });

  it("renders customer name when provided", () => {
    const { getByText } = render(<OrderCard {...baseOrder} customerName="John Doe" />);
    expect(getByText("John Doe")).toBeTruthy();
  });

  it("renders action button and calls onActionPress", () => {
    const onActionPress = jest.fn();
    const { getByText } = render(
      <OrderCard {...baseOrder} actionLabel="Track Order" onActionPress={onActionPress} />
    );
    expect(getByText("Track Order")).toBeTruthy();
    fireEvent.press(getByText("Track Order"));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<OrderCard {...baseOrder} onPress={onPress} />);
    fireEvent.press(getByText("Order #ORD-123"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
