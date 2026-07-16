import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import ChangePinScreen from "./change-pin";
import { usePinStatus, useChangePin, useSetPin } from "@/lib/hooks/use-wallet";
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

jest.mock("@/lib/hooks/use-wallet", () => ({
  usePinStatus: jest.fn(),
  useChangePin: jest.fn(),
  useSetPin: jest.fn(),
}));

jest.mock("@/lib/stores/popup-store", () => ({
  usePopupStore: jest.fn(),
}));

describe("ChangePinScreen", () => {
  const mockShowPopup = jest.fn();
  const mockChangePinMutateAsync = jest.fn();
  const mockSetPinMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePopupStore as unknown as jest.Mock).mockImplementation((selector?: any) =>
      selector ? selector({ showPopup: mockShowPopup }) : { showPopup: mockShowPopup }
    );
    (useChangePin as jest.Mock).mockReturnValue({
      mutateAsync: mockChangePinMutateAsync,
      isPending: false,
    });
    (useSetPin as jest.Mock).mockReturnValue({
      mutateAsync: mockSetPinMutateAsync,
      isPending: false,
    });
  });

  it("renders Current PIN field when pinStatus.hasPin is true and submits via changePin", async () => {
    (usePinStatus as jest.Mock).mockReturnValue({ data: { hasPin: true } });
    mockChangePinMutateAsync.mockResolvedValueOnce({});

    render(<ChangePinScreen />);
    expect(screen.getByText("Change Withdrawal PIN")).toBeTruthy();

    const inputs = screen.getAllByPlaceholderText("••••");
    expect(inputs.length).toBe(3); // Current, New, Confirm

    fireEvent.changeText(inputs[0], "1234");
    fireEvent.changeText(inputs[1], "5678");
    fireEvent.changeText(inputs[2], "5678");

    fireEvent.press(screen.getByText("Update PIN"));

    await waitFor(() => {
      expect(mockChangePinMutateAsync).toHaveBeenCalledWith({ currentPin: "1234", newPin: "5678" });
      expect(mockShowPopup).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", title: "PIN updated" })
      );
    });
  });

  it("hides Current PIN field when pinStatus.hasPin is false and submits via setPin", async () => {
    (usePinStatus as jest.Mock).mockReturnValue({ data: { hasPin: false } });
    mockSetPinMutateAsync.mockResolvedValueOnce({});

    render(<ChangePinScreen />);
    expect(screen.getByText("Set Withdrawal PIN")).toBeTruthy();

    const inputs = screen.getAllByPlaceholderText("••••");
    expect(inputs.length).toBe(2); // New, Confirm only

    fireEvent.changeText(inputs[0], "9999");
    fireEvent.changeText(inputs[1], "9999");

    fireEvent.press(screen.getByText("Set PIN"));

    await waitFor(() => {
      expect(mockSetPinMutateAsync).toHaveBeenCalledWith("9999");
      expect(mockShowPopup).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", title: "PIN updated" })
      );
    });
  });

  it("shows error popup when mutation rejects", async () => {
    (usePinStatus as jest.Mock).mockReturnValue({ data: { hasPin: true } });
    mockChangePinMutateAsync.mockRejectedValueOnce(
      new Error("Invalid PIN. 2 attempt(s) remaining")
    );

    render(<ChangePinScreen />);
    const inputs = screen.getAllByPlaceholderText("••••");

    fireEvent.changeText(inputs[0], "0000");
    fireEvent.changeText(inputs[1], "1111");
    fireEvent.changeText(inputs[2], "1111");

    fireEvent.press(screen.getByText("Update PIN"));

    await waitFor(() => {
      expect(mockShowPopup).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Couldn't update PIN",
          message: "Invalid PIN. 2 attempt(s) remaining",
        })
      );
    });
  });
});
