import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import ChangePasswordScreen from "../../../../app/(vendor)/(settings)/change-password";
import { authApi } from "@/lib/api/auth";
import { usePopupStore } from "@/lib/stores/popup-store";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("@/components/ui/Icon", () => ({
  Icon: () => null,
}));

jest.mock("@/components/ui/BackButton", () => ({
  BackButton: () => null,
}));

jest.mock("@/lib/api/auth", () => ({
  authApi: { changePassword: jest.fn() },
}));

jest.mock("@/lib/stores/popup-store", () => ({
  usePopupStore: jest.fn(),
}));

describe("ChangePasswordScreen", () => {
  const mockShowPopup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePopupStore as unknown as jest.Mock).mockReturnValue({ showPopup: mockShowPopup });
  });

  it("renders form fields correctly", () => {
    render(<ChangePasswordScreen />);
    expect(screen.getByPlaceholderText("Enter current password")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter new password")).toBeTruthy();
    expect(screen.getByPlaceholderText("Confirm new password")).toBeTruthy();
  });

  it("calls authApi.changePassword and shows success popup on valid submit", async () => {
    (authApi.changePassword as jest.Mock).mockResolvedValueOnce({ data: {} });
    render(<ChangePasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter current password"), "oldPass123");
    fireEvent.changeText(screen.getByPlaceholderText("Enter new password"), "newPass123!");
    fireEvent.changeText(screen.getByPlaceholderText("Confirm new password"), "newPass123!");

    const updateBtn = screen.getByText("Update Password");
    fireEvent.press(updateBtn);

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith("oldPass123", "newPass123!");
      expect(mockShowPopup).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", title: "Password changed" })
      );
    });
  });

  it("shows error popup when authApi.changePassword rejects", async () => {
    (authApi.changePassword as jest.Mock).mockRejectedValueOnce(
      new Error("Invalid current password")
    );
    render(<ChangePasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter current password"), "wrongPass");
    fireEvent.changeText(screen.getByPlaceholderText("Enter new password"), "newPass123!");
    fireEvent.changeText(screen.getByPlaceholderText("Confirm new password"), "newPass123!");

    const updateBtn = screen.getByText("Update Password");
    fireEvent.press(updateBtn);

    await waitFor(() => {
      expect(mockShowPopup).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Couldn't change password",
          message: "Invalid current password",
        })
      );
    });
  });
});
