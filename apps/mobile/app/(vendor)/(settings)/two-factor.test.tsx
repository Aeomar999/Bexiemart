import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import TwoFactorScreen from "./two-factor";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as useTwoFactorHooks from "@/lib/hooks/use-two-factor";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/hooks/use-two-factor", () => ({
  useTwoFactorStatus: jest.fn(),
  useEnableTwoFactor: jest.fn(),
  useVerifyTotp: jest.fn(),
  useDisableTwoFactor: jest.fn(),
  useGenerateBackupCodes: jest.fn(),
}));

jest.mock("@/lib/stores/popup-store", () => ({
  usePopupStore: () => ({
    showPopup: jest.fn(),
  }),
}));

jest.mock("@/components/ui/BackButton", () => ({
  BackButton: () => null,
}));

describe("TwoFactorScreen", () => {
  const mockEnableMutateAsync = jest.fn();
  const mockVerifyMutateAsync = jest.fn();
  const mockDisableMutateAsync = jest.fn();
  const mockRegenerateMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSafeAreaInsets as jest.Mock).mockReturnValue({ top: 20 });
    (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });

    (useTwoFactorHooks.useTwoFactorStatus as jest.Mock).mockReturnValue({
      data: { twoFactorEnabled: false },
      isLoading: false,
    });
    (useTwoFactorHooks.useEnableTwoFactor as jest.Mock).mockReturnValue({
      mutateAsync: mockEnableMutateAsync,
      isPending: false,
    });
    (useTwoFactorHooks.useVerifyTotp as jest.Mock).mockReturnValue({
      mutateAsync: mockVerifyMutateAsync,
      isPending: false,
    });
    (useTwoFactorHooks.useDisableTwoFactor as jest.Mock).mockReturnValue({
      mutateAsync: mockDisableMutateAsync,
      isPending: false,
    });
    (useTwoFactorHooks.useGenerateBackupCodes as jest.Mock).mockReturnValue({
      mutateAsync: mockRegenerateMutateAsync,
      isPending: false,
    });
  });

  it("renders disabled state correctly", () => {
    const { getByText } = render(<TwoFactorScreen />);
    expect(getByText("2FA is Disabled")).toBeTruthy();
    expect(getByText("Authenticator App")).toBeTruthy();
  });

  it("renders active state and recovery codes pressable when enabled", () => {
    (useTwoFactorHooks.useTwoFactorStatus as jest.Mock).mockReturnValue({
      data: { twoFactorEnabled: true },
      isLoading: false,
    });
    const { getByText, getByTestId } = render(<TwoFactorScreen />);
    expect(getByText("2FA is Active")).toBeTruthy();
    expect(getByTestId("recovery-codes-pressable")).toBeTruthy();
  });

  it("opens password prompt when switch is toggled to enable", () => {
    const { getByTestId, getByPlaceholderText } = render(<TwoFactorScreen />);
    fireEvent(getByTestId("2fa-toggle-switch"), "valueChange", true);
    expect(getByPlaceholderText("Account password")).toBeTruthy();
  });

  it("calls enable mutation and transitions to verify modal when password submitted", async () => {
    mockEnableMutateAsync.mockResolvedValue({
      totpURI: "otpauth://totp/Test?secret=SECRET123",
      backupCodes: ["CODE1", "CODE2"],
    });

    const { getByTestId, getByPlaceholderText, getByText } = render(<TwoFactorScreen />);
    fireEvent(getByTestId("2fa-toggle-switch"), "valueChange", true);

    fireEvent.changeText(getByPlaceholderText("Account password"), "password123");
    fireEvent.press(getByTestId("password-submit-button"));

    await waitFor(() => {
      expect(mockEnableMutateAsync).toHaveBeenCalledWith("password123");
      expect(getByText("SECRET123")).toBeTruthy();
    });
  });
});
