import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import WithdrawFundsScreen from "../../../../../app/(dispatcher)/(tabs)/(earnings)/withdraw";
import { useDispatcherEarnings } from "@/lib/hooks/use-dispatcher";
import {
  useBankAccounts,
  useMomoAccounts,
  usePinStatus,
  useWithdraw,
} from "@/lib/hooks/use-wallet";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("@/lib/stores/popup-store", () => ({
  usePopupStore: () => jest.fn(),
}));

jest.mock("@/lib/hooks/use-dispatcher", () => ({
  useDispatcherEarnings: jest.fn(),
}));

jest.mock("@/lib/hooks/use-wallet", () => ({
  useBankAccounts: jest.fn(),
  useMomoAccounts: jest.fn(),
  usePinStatus: jest.fn(),
  useWithdraw: jest.fn(),
}));

describe("WithdrawFundsScreen (Dispatcher)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 'No payout account' guard when methods are empty", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({ data: { pendingClearance: 100 } });
    (useBankAccounts as jest.Mock).mockReturnValue({ data: [] });
    (useMomoAccounts as jest.Mock).mockReturnValue({ data: [] });
    (usePinStatus as jest.Mock).mockReturnValue({ data: { hasPin: true } });
    (useWithdraw as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });

    render(<WithdrawFundsScreen />);
    expect(screen.getByText("No payout account")).toBeTruthy();
    expect(screen.getByText("Add payout account")).toBeTruthy();
  });

  it("renders 'Set a withdrawal PIN' guard when methods exist but pin not set", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({ data: { pendingClearance: 100 } });
    (useBankAccounts as jest.Mock).mockReturnValue({
      data: [{ id: "b1", bankName: "Ecobank", accountNumber: "1234" }],
    });
    (useMomoAccounts as jest.Mock).mockReturnValue({ data: [] });
    (usePinStatus as jest.Mock).mockReturnValue({ data: { hasPin: false } });
    (useWithdraw as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });

    render(<WithdrawFundsScreen />);
    expect(screen.getByText("Set a withdrawal PIN")).toBeTruthy();
    expect(screen.getByText("Set up PIN")).toBeTruthy();
  });

  it("renders withdraw form when methods and PIN are set", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({ data: { pendingClearance: 250 } });
    (useBankAccounts as jest.Mock).mockReturnValue({
      data: [{ id: "b1", bankName: "Ecobank", accountNumber: "1234" }],
    });
    (useMomoAccounts as jest.Mock).mockReturnValue({
      data: [{ id: "m1", provider: "MTN", phoneNumber: "0241234567" }],
    });
    (usePinStatus as jest.Mock).mockReturnValue({ data: { hasPin: true } });
    (useWithdraw as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });

    render(<WithdrawFundsScreen />);
    expect(screen.getByText("Available: GHS 250.00")).toBeTruthy();
    expect(screen.getByText("Transfer To")).toBeTruthy();
    expect(screen.getByText("Ecobank")).toBeTruthy();
    expect(screen.getByText("MTN")).toBeTruthy();
  });
});
