import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import DispatcherProfile from "../../../../app/(dispatcher)/(tabs)/profile";
import { useDispatcherProfile, useDispatcherAnalytics } from "@/lib/hooks/use-dispatcher";
import { useNavigationApp } from "@/lib/stores/navigation-app-store";

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
    useNavigationApp.setState({ app: "google" });
  });

  it("renders real 30-day metrics and vehicle details, with no fabricated rating", () => {
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

    // Metrics are labelled with the window they cover
    expect(screen.getByText("Last 30 days")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("Trips")).toBeTruthy();
    expect(screen.getByText("GH₵ 350.50")).toBeTruthy();
    expect(screen.getByText("Earnings")).toBeTruthy();

    // Check real vehicle details
    expect(screen.getByText("Van")).toBeTruthy();
    expect(screen.getByText("GH-8888-23")).toBeTruthy();
    expect(screen.getByText("Google Maps")).toBeTruthy();

    // There is no rating data for riders, so none is shown
    expect(screen.queryByText("Rating")).toBeNull();
    expect(screen.queryByText("4.9")).toBeNull();

    expect(screen.queryByText("Acceptance")).toBeNull();
    expect(screen.queryByText("Auto-Accept Trips")).toBeNull();
  });

  it("opens edit profile when the identity row is pressed", () => {
    (useDispatcherProfile as jest.Mock).mockReturnValue({ data: null });
    (useDispatcherAnalytics as jest.Mock).mockReturnValue({ data: null });

    render(<DispatcherProfile />);
    fireEvent.press(screen.getByText("John Driver"));

    expect(mockPush).toHaveBeenCalledWith("/(dispatcher)/edit-profile");
  });

  it("routes vehicle and navigation rows to their screens", () => {
    (useDispatcherProfile as jest.Mock).mockReturnValue({ data: null });
    (useDispatcherAnalytics as jest.Mock).mockReturnValue({ data: null });

    render(<DispatcherProfile />);

    fireEvent.press(screen.getByText("Type"));
    expect(mockPush).toHaveBeenLastCalledWith("/(dispatcher)/vehicle");

    fireEvent.press(screen.getByText("Licence plate"));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/(dispatcher)/vehicle",
      params: { field: "plate" },
    });

    fireEvent.press(screen.getByText("Navigation app"));
    expect(mockPush).toHaveBeenLastCalledWith("/(dispatcher)/navigation-app");
  });

  it("shows the saved navigation app preference", () => {
    (useDispatcherProfile as jest.Mock).mockReturnValue({ data: null });
    (useDispatcherAnalytics as jest.Mock).mockReturnValue({ data: null });
    useNavigationApp.setState({ app: "waze" });

    render(<DispatcherProfile />);

    expect(screen.getByText("Waze")).toBeTruthy();
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
