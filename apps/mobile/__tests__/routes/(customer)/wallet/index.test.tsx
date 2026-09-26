import React from "react";
import { render, screen, act } from "@testing-library/react-native";
import WalletScreen from "../../../../app/(customer)/wallet/index";
import { useWallet, useTransactions } from "@/lib/hooks/use-wallet";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));

jest.mock("@/components/ui/BackButton", () => ({ BackButton: () => null }));

jest.mock("@/lib/hooks/use-wallet", () => ({
  useWallet: jest.fn(),
  useTransactions: jest.fn(),
}));

const txns = { data: { data: [] }, refetch: jest.fn() };

describe("WalletScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useBalanceVisibility.setState({ hidden: false });
    });
    (useTransactions as jest.Mock).mockReturnValue(txns);
  });

  it("shows wallet balance and money on hold for orders", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: { balance: 1250, heldInEscrow: 180, currency: "GHS" },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    expect(
      screen.getByLabelText("Wallet balance, GHS 1,250.00. On hold for orders, GHS 180.00.")
    ).toBeTruthy();
    expect(screen.getByText("Top up")).toBeTruthy();
  });

  it("treats a missing heldInEscrow (older server) as zero", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: { balance: 1250, currency: "GHS" },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    expect(
      screen.getByLabelText("Wallet balance, GHS 1,250.00. On hold for orders, GHS 0.00.")
    ).toBeTruthy();
  });

  it("uses navy quick actions without a duplicate Top up", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: { balance: 1, currency: "GHS" },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    for (const label of ["Send", "Request", "Cards", "Link account"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getAllByText("Top up")).toHaveLength(1);
  });

  it("never shows 0.00 while loading", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    expect(screen.queryByText(/0\.00/)).toBeNull();
  });

  it("does not claim a loyalty tier", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: { balance: 1, currency: "GHS" },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    expect(screen.queryByText(/Gold tier/i)).toBeNull();
    expect(screen.getByText("BexieCoins")).toBeTruthy();
  });
});
