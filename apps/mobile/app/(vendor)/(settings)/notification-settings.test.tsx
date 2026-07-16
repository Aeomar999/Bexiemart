import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import NotificationSettingsScreen from "./notification-settings";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/lib/hooks/use-notification-preferences";

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

jest.mock("@/lib/hooks/use-notification-preferences", () => ({
  useNotificationPreferences: jest.fn(),
  useUpdateNotificationPreferences: jest.fn(),
}));

describe("NotificationSettingsScreen", () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUpdateNotificationPreferences as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it("renders with default toggles when prefs are undefined", () => {
    (useNotificationPreferences as jest.Mock).mockReturnValue({ data: undefined });
    render(<NotificationSettingsScreen />);
    expect(screen.getByText("New Orders")).toBeTruthy();
    expect(screen.getByText("Push Notifications")).toBeTruthy();
  });

  it("renders server values when preferences are present", () => {
    (useNotificationPreferences as jest.Mock).mockReturnValue({
      data: {
        newOrder: false,
        orderCancel: true,
        payout: true,
        chat: true,
        promo: true,
        email: false,
        sms: true,
      },
    });
    render(<NotificationSettingsScreen />);
    expect(screen.getByText("New Orders")).toBeTruthy();
    expect(screen.getByText("Promotions")).toBeTruthy();
  });

  it("calls mutate with flipped value on toggle", () => {
    (useNotificationPreferences as jest.Mock).mockReturnValue({
      data: {
        newOrder: true,
        orderCancel: true,
        payout: true,
        chat: true,
        promo: false,
        email: true,
        sms: false,
      },
    });
    render(<NotificationSettingsScreen />);
    const switches = screen.UNSAFE_getAllByType("RCTSwitch" as any);
    // First switch is newOrder
    fireEvent(switches[0], "valueChange", false);
    expect(mockMutate).toHaveBeenCalledWith({ newOrder: false });
  });
});
