import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import EarningsDashboardScreen from "../../../../app/(vendor)/(earnings)/index";
import { useVendorEarnings } from "@/lib/hooks/use-vendor";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("@/lib/hooks/use-vendor", () => ({
  useVendorEarnings: jest.fn(),
}));

const ready = {
  availableBalance: 12480.5,
  pendingClearance: 2150,
  todayRevenue: 640,
  thisWeekRevenue: 4320,
  recentTransactions: [],
};

describe("Vendor EarningsDashboardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useBalanceVisibility.setState({ hidden: false });
    });
  });

  it("shows available, pending clearance and the stat tiles", () => {
    (useVendorEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    expect(
      screen.getByLabelText(
        "Available to withdraw, GHS 12,480.50. Pending clearance, GHS 2,150.00."
      )
    ).toBeTruthy();
    expect(screen.getByText("GHS 640.00")).toBeTruthy();
    expect(screen.getByText("GHS 4,320.00")).toBeTruthy();
    expect(screen.queryByText(/GH₵/)).toBeNull();
  });

  it("opens withdraw from the card action", () => {
    (useVendorEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    fireEvent.press(screen.getByText("Withdraw"));
    expect(mockPush).toHaveBeenCalledWith("/(vendor)/(earnings)/withdraw");
  });

  it("never shows 0.00 while loading", () => {
    (useVendorEarnings as jest.Mock).mockReturnValue({
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
    (useVendorEarnings as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    render(<EarningsDashboardScreen />);
    expect(screen.getByText("Couldn't load your balance")).toBeTruthy();
    fireEvent.press(screen.getByText("Retry"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("keeps showing the last balance when a background refresh fails", () => {
    (useVendorEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    expect(
      screen.getByLabelText(
        "Available to withdraw, GHS 12,480.50. Pending clearance, GHS 2,150.00."
      )
    ).toBeTruthy();
    expect(screen.queryByText("Couldn't load your balance")).toBeNull();
  });
});
