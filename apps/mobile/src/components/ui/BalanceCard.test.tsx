import React from "react";
import { StyleSheet } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";
import { BalanceCard } from "./BalanceCard";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

const held = { label: "Pending clearance", amount: 2150, info: "From orders still in escrow." };
const flat = (el: any) => StyleSheet.flatten(el.props.style);

describe("BalanceCard", () => {
  beforeEach(() => {
    // Block-body callback: `setState` here comes from zustand's `persist`
    // middleware, which returns the (fire-and-forget) storage-write promise.
    // An expression-body arrow would implicitly return that promise, making
    // React's `act()` treat this as an unawaited async act — which corrupts
    // the test renderer for every `render()` call in this file. See
    // task-2-report.md for the isolated repro.
    act(() => {
      useBalanceVisibility.setState({ hidden: false });
    });
  });

  it("formats the available amount with grouping and two decimals", () => {
    const { getByTestId } = render(
      <BalanceCard label="Available to withdraw" available={12480.5} />
    );
    expect(getByTestId("balance-card-amount").props.children).toBe("12,480.50");
  });

  it("renders no split bar or legend without held", () => {
    const { queryByTestId, queryByText } = render(
      <BalanceCard label="Wallet balance" available={50} />
    );
    expect(queryByTestId("balance-card-bar-available")).toBeNull();
    expect(queryByTestId("balance-card-bar-empty")).toBeNull();
    expect(queryByText("Available")).toBeNull();
  });

  it("sizes bar segments in proportion to available and held", () => {
    const { getByTestId } = render(
      <BalanceCard label="Available to withdraw" available={12480.5} held={held} />
    );
    expect(flat(getByTestId("balance-card-bar-available"))).toMatchObject({ flex: 12480.5 });
    expect(flat(getByTestId("balance-card-bar-held"))).toMatchObject({ flex: 2150 });
  });

  it("renders an empty track and 0.00 when both amounts are zero", () => {
    const { getByTestId } = render(
      <BalanceCard label="Available to withdraw" available={0} held={{ ...held, amount: 0 }} />
    );
    expect(getByTestId("balance-card-bar-empty")).toBeTruthy();
    expect(getByTestId("balance-card-amount").props.children).toBe("0.00");
  });

  it("shows legend rows with formatted values", () => {
    const { getByText } = render(<BalanceCard label="x" available={12480.5} held={held} />);
    expect(getByText("Available")).toBeTruthy();
    expect(getByText("GHS 12,480.50")).toBeTruthy();
    expect(getByText("Pending clearance")).toBeTruthy();
    expect(getByText("GHS 2,150.00")).toBeTruthy();
  });

  it("masks every amount and neutralises the bar when hidden", () => {
    act(() => {
      useBalanceVisibility.setState({ hidden: true });
    });
    const { getByTestId, getAllByText, queryByText, queryByTestId } = render(
      <BalanceCard label="x" available={12480.5} held={held} />
    );
    expect(getByTestId("balance-card-amount").props.children).toBe("••••••");
    expect(getAllByText("GHS ••••")).toHaveLength(2);
    expect(queryByText(/12,480/)).toBeNull();
    expect(queryByText(/2,150/)).toBeNull();
    expect(getByTestId("balance-card-bar-empty")).toBeTruthy();
    expect(queryByTestId("balance-card-bar-held")).toBeNull();
  });

  it("toggles the shared hidden preference from the eye button", () => {
    const { getByLabelText } = render(<BalanceCard label="x" available={1} />);
    fireEvent.press(getByLabelText("Hide balances"));
    expect(useBalanceVisibility.getState().hidden).toBe(true);
    expect(getByLabelText("Show balances")).toBeTruthy();
  });

  it("renders skeletons and never 0.00 while loading", () => {
    const { getByTestId, getByLabelText, queryByText } = render(
      <BalanceCard
        label="x"
        available={0}
        held={held}
        action={{ title: "Withdraw", icon: "arrow-up-right", onPress: jest.fn() }}
        status="loading"
      />
    );
    expect(getByTestId("balance-card-loading")).toBeTruthy();
    expect(getByLabelText("Loading balance")).toBeTruthy();
    expect(queryByText(/0\.00/)).toBeNull();
    expect(queryByText("Withdraw")).toBeNull();
  });

  it("renders the error message and Retry without amounts", () => {
    const onRetry = jest.fn();
    const { getByText, queryByText, getByTestId } = render(
      <BalanceCard label="x" available={500} held={held} status="error" onRetry={onRetry} />
    );
    expect(getByText("Couldn't load your balance")).toBeTruthy();
    expect(queryByText(/500/)).toBeNull();
    fireEvent.press(getByTestId("balance-card-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("toggles the held explanation and reports expanded state", () => {
    const { getByLabelText, getByText, queryByText } = render(
      <BalanceCard label="x" available={1} held={held} />
    );
    expect(getByLabelText("What is Pending clearance?").props.accessibilityState).toMatchObject({
      expanded: false,
    });
    expect(queryByText("From orders still in escrow.")).toBeNull();
    fireEvent.press(getByLabelText("What is Pending clearance?"));
    expect(getByText("From orders still in escrow.")).toBeTruthy();
    expect(getByLabelText("What is Pending clearance?").props.accessibilityState).toMatchObject({
      expanded: true,
    });
  });

  it("exposes one summary sentence for screen readers", () => {
    const { getByLabelText, rerender } = render(
      <BalanceCard label="Available to withdraw" available={12480.5} held={held} />
    );
    expect(
      getByLabelText("Available to withdraw, GHS 12,480.50. Pending clearance, GHS 2,150.00.")
    ).toBeTruthy();
    act(() => {
      useBalanceVisibility.setState({ hidden: true });
    });
    rerender(<BalanceCard label="Available to withdraw" available={12480.5} held={held} />);
    expect(getByLabelText("Available to withdraw, hidden.")).toBeTruthy();
  });

  it("fires the primary action", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <BalanceCard label="x" available={1} action={{ title: "Top up", icon: "plus", onPress }} />
    );
    fireEvent.press(getByText("Top up"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("compact size shows one held line and the press hint, no legend or action", () => {
    const onPress = jest.fn();
    const { getByText, queryByText, getByLabelText } = render(
      <BalanceCard
        label="x"
        available={100}
        held={held}
        size="sm"
        onPress={onPress}
        pressHint="View earnings"
        action={{ title: "Withdraw", icon: "arrow-up-right", onPress: jest.fn() }}
      />
    );
    expect(getByText("Pending clearance")).toBeTruthy();
    expect(getByText("GHS 2,150.00")).toBeTruthy();
    expect(queryByText("Available")).toBeNull();
    expect(queryByText("Withdraw")).toBeNull();
    fireEvent.press(getByLabelText("View earnings"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
