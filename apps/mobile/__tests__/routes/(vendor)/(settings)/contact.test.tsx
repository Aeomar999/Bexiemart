import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import VendorContactScreen from "../../../../app/(vendor)/(settings)/contact";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as useSupportHooks from "@/lib/hooks/use-support";
import { Alert } from "react-native";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/hooks/use-support", () => ({
  useCreateSupportTicket: jest.fn(),
}));

jest.mock("@/components/ui/BackButton", () => ({
  BackButton: () => null,
}));

describe("VendorContactScreen", () => {
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (useSafeAreaInsets as jest.Mock).mockReturnValue({ top: 20 });
    (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });

    (useSupportHooks.useCreateSupportTicket as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it("renders correctly with default category", () => {
    const { getByText, getByTestId } = render(<VendorContactScreen />);
    expect(getByText("Contact Support")).toBeTruthy();
    expect(getByText("Payouts & Earnings")).toBeTruthy();
    expect(getByTestId("subject-input")).toBeTruthy();
  });

  it("shows category picker and updates selected category", () => {
    const { getByTestId, getByText } = render(<VendorContactScreen />);
    fireEvent.press(getByTestId("category-picker-button"));

    expect(getByTestId("category-option-ORDER_ISSUE")).toBeTruthy();
    fireEvent.press(getByTestId("category-option-ORDER_ISSUE"));

    expect(getByText("Order Issue")).toBeTruthy();
  });

  it("alerts if subject is too short", async () => {
    const { getByTestId } = render(<VendorContactScreen />);
    fireEvent.changeText(getByTestId("subject-input"), "ab");
    fireEvent.press(getByTestId("submit-ticket-button"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Add a subject",
      expect.stringContaining("Please enter a short subject (3+ characters).")
    );
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("submits support ticket successfully", async () => {
    mockMutateAsync.mockResolvedValue({ id: "ticket-1" });

    const { getByTestId } = render(<VendorContactScreen />);
    fireEvent.changeText(getByTestId("subject-input"), "Delayed payout");
    fireEvent.changeText(getByTestId("order-id-input"), "ORD-1234");
    fireEvent.changeText(getByTestId("description-input"), "My payout is missing.");

    fireEvent.press(getByTestId("submit-ticket-button"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        category: "PAYMENT_REFUND",
        subject: "Delayed payout",
        content: "My payout is missing.",
        orderId: "ORD-1234",
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        "Ticket Submitted",
        expect.stringContaining("Our seller support team will investigate"),
        expect.any(Array)
      );
    });
  });
});
