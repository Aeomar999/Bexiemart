import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import EarningsDashboardScreen from "../../../../../app/(dispatcher)/(tabs)/(earnings)/index";
import { useDispatcherEarnings } from "@/lib/hooks/use-dispatcher";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("@/lib/hooks/use-dispatcher", () => ({
  useDispatcherEarnings: jest.fn(),
}));

const ready = {
  availableBalance: 312.4,
  pendingClearance: 134,
  todayRevenue: 84,
  thisWeekRevenue: 520,
  recentTransactions: [
    {
      id: "t1",
      type: "payout",
      title: "Delivery payout",
      amount: 12,
      status: "completed",
      date: "Sep 25",
    },
  ],
};

describe("Rider EarningsDashboardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useBalanceVisibility.setState({ hidden: false });
    });
  });

  it("shows available, pending clearance and the stat tiles", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    expect(
      screen.getByLabelText("Available to withdraw, GHS 312.40. Pending clearance, GHS 134.00.")
    ).toBeTruthy();
    expect(screen.getByText("GHS 84.00")).toBeTruthy();
    expect(screen.getByText("GHS 520.00")).toBeTruthy();
    expect(screen.getByText("+GHS 12.00")).toBeTruthy();
    expect(screen.queryByText(/GH₵/)).toBeNull();
  });

  it("has a labelled Withdraw action that opens withdraw", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    fireEvent.press(screen.getByText("Withdraw"));
    expect(mockPush).toHaveBeenCalledWith("/(dispatcher)/(tabs)/(earnings)/withdraw");
  });

  it("never shows 0.00 while loading", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    expect(screen.queryByText(/0\.00/)).toBeNull();
  });

  it("offers Retry on error and refetches", () => {
    const refetch = jest.fn();
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    render(<EarningsDashboardScreen />);
    fireEvent.press(screen.getByText("Retry"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("keeps showing the last balance when a background refresh fails", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    expect(
      screen.getByLabelText("Available to withdraw, GHS 312.40. Pending clearance, GHS 134.00.")
    ).toBeTruthy();
    expect(screen.queryByText("Couldn't load your balance")).toBeNull();
  });
});
