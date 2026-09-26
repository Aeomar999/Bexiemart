import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { EarningsStatTiles } from "./EarningsStatTiles";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

describe("EarningsStatTiles", () => {
  beforeEach(() => {
    act(() => {
      useBalanceVisibility.setState({ hidden: false });
    });
  });

  it("renders formatted today and this-week amounts", () => {
    const { getByText } = render(
      <EarningsStatTiles today={640} thisWeek={4320} onPress={jest.fn()} />
    );
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("GHS 640.00")).toBeTruthy();
    expect(getByText("This week")).toBeTruthy();
    expect(getByText("GHS 4,320.00")).toBeTruthy();
  });

  it("masks amounts when balances are hidden", () => {
    act(() => {
      useBalanceVisibility.setState({ hidden: true });
    });
    const { getAllByText, queryByText } = render(
      <EarningsStatTiles today={640} thisWeek={4320} onPress={jest.fn()} />
    );
    expect(getAllByText("GHS ••••")).toHaveLength(2);
    expect(queryByText(/640/)).toBeNull();
  });

  it("shows no amounts while loading", () => {
    const { queryByText } = render(
      <EarningsStatTiles today={0} thisWeek={0} onPress={jest.fn()} loading />
    );
    expect(queryByText(/0\.00/)).toBeNull();
  });

  it("calls onPress from either tile", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<EarningsStatTiles today={1} thisWeek={2} onPress={onPress} />);
    fireEvent.press(getByTestId("stat-tile-today"));
    fireEvent.press(getByTestId("stat-tile-week"));
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
