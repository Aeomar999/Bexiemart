import React from "react";
import { Linking } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import * as Location from "expo-location";
import DispatcherMap from "../../../../app/(dispatcher)/(tabs)/(home)/index";
import {
  useDispatcherProfile,
  useSetDispatcherStatus,
  useDispatcherEarnings,
} from "@/lib/hooks/use-dispatcher";
import { dispatcherApi } from "@/lib/api/dispatcher";
import { deliverySocketService } from "@/lib/delivery-socket";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";
import Toast from "@/lib/toast-polyfill";

const mockPush = jest.fn();
const mockMutate = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "denied" })),
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 6.67, longitude: -1.56 } })
  ),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  Accuracy: { High: 4 },
}));

jest.mock("@/lib/hooks/use-dispatcher", () => ({
  useDispatcherProfile: jest.fn(),
  useSetDispatcherStatus: jest.fn(),
  useDispatcherEarnings: jest.fn(),
  useAvailableTasks: jest.fn(() => ({ data: undefined })),
  useMyTasks: jest.fn(() => ({ data: undefined })),
  useAcceptTask: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
  useUpdateTaskStatus: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));

jest.mock("@/lib/api/dispatcher", () => ({
  dispatcherApi: {
    updateStatus: jest.fn(() => Promise.resolve({ data: {} })),
    updateLocation: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

jest.mock("@/lib/delivery-socket", () => ({
  deliverySocketService: { connect: jest.fn(), sendLocation: jest.fn() },
}));

jest.mock("@/lib/toast-polyfill", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const setProfileStatus = (status: string | undefined, isPending = false) => {
  (useDispatcherProfile as jest.Mock).mockReturnValue({
    data: status ? { id: "d1", status } : undefined,
    isPending,
  });
};

describe("Dispatcher home (map) screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBalanceVisibility.setState({ hidden: false });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });
    (useSetDispatcherStatus as jest.Mock).mockReturnValue({ mutate: mockMutate, isPending: false });
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: { todayRevenue: 42.5 },
      isSuccess: true,
    });
  });

  it("shows the offline sheet with a Go online button and doesn't touch the server on mount", async () => {
    setProfileStatus("OFFLINE");
    render(<DispatcherMap />);

    expect(screen.getByText("You're offline")).toBeTruthy();
    expect(screen.getByText("Offline")).toBeTruthy();
    expect(screen.getByText("Go online")).toBeTruthy();
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
    expect(dispatcherApi.updateStatus).not.toHaveBeenCalled();
    expect(deliverySocketService.connect).not.toHaveBeenCalled();
  });

  it("asks the server to go online when Go online is pressed", async () => {
    setProfileStatus("OFFLINE");
    render(<DispatcherMap />);

    fireEvent.press(screen.getByText("Go online"));

    expect(mockMutate).toHaveBeenCalledWith("ONLINE", expect.any(Object));
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
  });

  it("stays offline and explains why when going online fails", async () => {
    setProfileStatus("OFFLINE");
    mockMutate.mockImplementation((_status, opts) => opts.onError(new Error("network")));
    render(<DispatcherMap />);

    fireEvent.press(screen.getByText("Go online"));

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", text1: "Couldn't go online" })
    );
    expect(screen.getByText("You're offline")).toBeTruthy();
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
  });

  it("restores the online state from the server and offers Go offline", async () => {
    setProfileStatus("ONLINE");
    render(<DispatcherMap />);

    expect(screen.getByText("Online")).toBeTruthy();
    expect(screen.getByText("Finding tasks near you")).toBeTruthy();
    expect(deliverySocketService.connect).toHaveBeenCalled();

    fireEvent.press(screen.getByText("Go offline"));
    expect(mockMutate).toHaveBeenCalledWith("OFFLINE", expect.any(Object));
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
  });

  it("shows a neutral loading state while the saved status is being fetched", async () => {
    setProfileStatus(undefined, true);
    render(<DispatcherMap />);

    expect(screen.getByText("Checking your status…")).toBeTruthy();
    expect(screen.queryByText("You're offline")).toBeNull();
    expect(screen.queryByText("Go online")).toBeNull();
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
  });

  it("flags blocked location and sends the rider to Settings when it can't be re-requested", async () => {
    setProfileStatus("OFFLINE");
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
    });
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    render(<DispatcherMap />);

    expect(await screen.findByText("Location is off")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Turn on location"));

    await waitFor(() => expect(openSettings).toHaveBeenCalled());
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it("shows today's earnings in the header and opens the earnings tab", async () => {
    setProfileStatus("OFFLINE");
    render(<DispatcherMap />);

    const chip = screen.getByLabelText("Today's earnings: GHS 42.50");
    fireEvent.press(chip);

    expect(mockPush).toHaveBeenCalledWith("/(dispatcher)/(tabs)/(earnings)");
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
  });

  it("keeps the earnings amount out of the accessibility label when balances are hidden", async () => {
    setProfileStatus("OFFLINE");
    useBalanceVisibility.setState({ hidden: true });
    render(<DispatcherMap />);

    expect(screen.getByLabelText("Today's earnings: hidden")).toBeTruthy();
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
  });
});
