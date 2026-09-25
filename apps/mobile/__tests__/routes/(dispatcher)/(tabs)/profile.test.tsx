import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import DispatcherProfile from "../../../../app/(dispatcher)/(tabs)/profile";
import { useDispatcherProfile, useDispatcherAnalytics } from "@/lib/hooks/use-dispatcher";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: { name: "John Driver", email: "john@bexiemart.com", image: null },
      logout: jest.fn().mockResolvedValue(true),
    }),
}));

jest.mock("@/lib/feature-flags", () => ({
  useAuthEnabled: () => ({ authEnabled: true }),
}));

jest.mock("@/lib/hooks/use-dispatcher", () => ({
  useDispatcherProfile: jest.fn(),
  useDispatcherAnalytics: jest.fn(),
}));

describe("DispatcherProfile Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders real metrics and vehicle details, omitting auto-accept", () => {
    (useDispatcherProfile as jest.Mock).mockReturnValue({
      data: { vehicleType: "van", plateNumber: "GH-8888-23" },
    });
    (useDispatcherAnalytics as jest.Mock).mockReturnValue({
      data: { trips30Days: 42, revenue30Days: 350.5 },
    });

    render(<DispatcherProfile />);

    // Check header and user info
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.getByText("John Driver")).toBeTruthy();
    expect(screen.getByText("john@bexiemart.com")).toBeTruthy();

    // Check real metrics
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("Trips")).toBeTruthy();
    expect(screen.getByText("GH₵ 350.50")).toBeTruthy();
    expect(screen.getByText("Revenue")).toBeTruthy();

    // Check real vehicle details
    expect(screen.getByText("Van")).toBeTruthy();
    expect(screen.getByText("GH-8888-23")).toBeTruthy();

    // Rating is currently hardcoded in the UI
    expect(screen.getByText("Rating")).toBeTruthy();
    expect(screen.getByText("4.9")).toBeTruthy();

    expect(screen.queryByText("Acceptance")).toBeNull();
    expect(screen.queryByText("Auto-Accept Trips")).toBeNull();
  });

  it("navigates to help screen when Driver support is clicked", () => {
    (useDispatcherProfile as jest.Mock).mockReturnValue({ data: null });
    (useDispatcherAnalytics as jest.Mock).mockReturnValue({ data: null });

    render(<DispatcherProfile />);
    const supportBtn = screen.getByText("Driver support");
    fireEvent.press(supportBtn);

    expect(mockPush).toHaveBeenCalledWith("/(dispatcher)/help");
  });
});
