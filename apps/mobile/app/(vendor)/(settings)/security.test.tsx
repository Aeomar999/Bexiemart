import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import SecurityScreen from "./security";
import {
  useSessions,
  useRevokeSession,
  useRevokeOtherSessions,
  parseDeviceLabel,
} from "@/lib/hooks/use-sessions";
import { useAuthStore } from "@/lib/stores/auth-store";
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

jest.mock("@/lib/hooks/use-sessions", () => ({
  useSessions: jest.fn(),
  useRevokeSession: jest.fn(),
  useRevokeOtherSessions: jest.fn(),
  parseDeviceLabel: (ua: any) => (ua ? "iOS Device" : "Unknown Device"),
}));

jest.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("@/lib/stores/popup-store", () => ({
  usePopupStore: jest.fn(),
}));

describe("SecurityScreen", () => {
  const mockShowPopup = jest.fn();
  const mockRevokeMutateAsync = jest.fn();
  const mockRevokeOthersMutateAsync = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePopupStore as unknown as jest.Mock).mockImplementation((selector?: any) =>
      selector ? selector({ showPopup: mockShowPopup }) : { showPopup: mockShowPopup }
    );
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      token: "current-tok",
      logout: mockLogout,
    });
    (useRevokeSession as jest.Mock).mockReturnValue({
      mutateAsync: mockRevokeMutateAsync,
      isPending: false,
    });
    (useRevokeOtherSessions as jest.Mock).mockReturnValue({
      mutateAsync: mockRevokeOthersMutateAsync,
      isPending: false,
    });
  });

  it("renders active sessions and distinguishes current device", () => {
    (useSessions as jest.Mock).mockReturnValue({
      data: [
        { id: "1", token: "current-tok", userAgent: "iPhone", createdAt: "2026-07-01" },
        { id: "2", token: "other-tok", userAgent: "Mac", createdAt: "2026-07-01" },
      ],
      isLoading: false,
    });

    render(<SecurityScreen />);
    expect(screen.getByText("Security")).toBeTruthy();
    expect(screen.getByText("Active Sessions")).toBeTruthy();
    expect(screen.getByText("This Device • Active Now")).toBeTruthy();
    expect(screen.getByText("Log out others")).toBeTruthy();
  });

  it("revokes current device and calls logout when selected and confirmed", async () => {
    (useSessions as jest.Mock).mockReturnValue({
      data: [{ id: "1", token: "current-tok", userAgent: "iPhone", createdAt: "2026-07-01" }],
      isLoading: false,
    });
    mockRevokeMutateAsync.mockResolvedValueOnce({});

    render(<SecurityScreen />);
    fireEvent.press(screen.getByText("This Device • Active Now"));
    fireEvent.press(screen.getByText("Log out of this device"));

    await waitFor(() => {
      expect(mockRevokeMutateAsync).toHaveBeenCalledWith("current-tok");
      expect(mockLogout).toHaveBeenCalled();
      expect(mockShowPopup).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", title: "Session revoked" })
      );
    });
  });

  it("revokes other devices when 'Log out others' is pressed", async () => {
    (useSessions as jest.Mock).mockReturnValue({
      data: [
        { id: "1", token: "current-tok", userAgent: "iPhone" },
        { id: "2", token: "other-tok", userAgent: "Mac" },
      ],
      isLoading: false,
    });
    mockRevokeOthersMutateAsync.mockResolvedValueOnce({});

    render(<SecurityScreen />);
    fireEvent.press(screen.getByText("Log out others"));

    await waitFor(() => {
      expect(mockRevokeOthersMutateAsync).toHaveBeenCalled();
      expect(mockShowPopup).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", title: "Other sessions revoked" })
      );
    });
  });
});
