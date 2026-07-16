import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import RewardsScreen from "./rewards";
import { useCoinsSummary, useConvertCoins } from "@/lib/hooks/use-wallet";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock("@/components/ui/Icon", () => ({
  Icon: () => null,
}));

jest.mock("@/components/ui/BackButton", () => ({
  BackButton: () => null,
}));

jest.mock("@/lib/hooks/use-wallet", () => ({
  useCoinsSummary: jest.fn(),
  useConvertCoins: jest.fn(),
}));

describe("RewardsScreen", () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useConvertCoins as jest.Mock).mockReturnValue({ mutate: mockMutate, isPending: false });
  });

  it("renders loading indicator when summary is loading", () => {
    (useCoinsSummary as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
    render(<RewardsScreen />);
    expect(screen.getByTestId("rewards-loading")).toBeTruthy();
  });

  it("renders balance and disables redeem button when balance < 100", () => {
    (useCoinsSummary as jest.Mock).mockReturnValue({
      data: {
        balance: 50,
        ratePerCoin: 0.01,
        earn: { completeProfile: false, firstTopup: false, orders: 0, referrals: 0 },
      },
      isLoading: false,
    });
    render(<RewardsScreen />);
    expect(screen.getByTestId("coins-balance").children[0]).toBe("50");
    const redeemBtn = screen.getByTestId("redeem-button");
    expect(redeemBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables redeem button when balance >= 100 and renders earn states", () => {
    (useCoinsSummary as jest.Mock).mockReturnValue({
      data: {
        balance: 450,
        ratePerCoin: 0.01,
        earn: { completeProfile: true, firstTopup: true, orders: 2, referrals: 1 },
      },
      isLoading: false,
    });
    render(<RewardsScreen />);
    expect(screen.getByTestId("coins-balance").children[0]).toBe("450");
    const redeemBtn = screen.getByTestId("redeem-button");
    expect(redeemBtn.props.accessibilityState?.disabled).toBeFalsy();
    expect(screen.getByText("2 completed")).toBeTruthy();
    expect(screen.getByText("1 referred")).toBeTruthy();
  });
});
