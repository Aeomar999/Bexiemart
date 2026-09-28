import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import VehicleScreen from "../../../app/(dispatcher)/vehicle";
import { useDispatcherProfile, useUpdateDispatcherProfile } from "@/lib/hooks/use-dispatcher";

const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("@/lib/hooks/use-dispatcher", () => ({
  useDispatcherProfile: jest.fn(),
  useUpdateDispatcherProfile: jest.fn(),
}));

describe("VehicleScreen", () => {
  const mutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    (useDispatcherProfile as jest.Mock).mockReturnValue({
      data: { vehicleType: "bike", plateNumber: "AS-1234-21" },
    });
    (useUpdateDispatcherProfile as jest.Mock).mockReturnValue({ mutate, isPending: false });
  });

  const saveButton = () => screen.getByRole("button", { name: "Save changes" });

  it("pre-selects the saved vehicle and plate", () => {
    render(<VehicleScreen />);
    expect(screen.getByRole("radio", { name: "Bike" }).props.accessibilityState).toEqual({
      checked: true,
    });
    expect(screen.getByDisplayValue("AS-1234-21")).toBeTruthy();
  });

  it("keeps Save disabled until something changes", () => {
    render(<VehicleScreen />);
    expect(saveButton()).toBeDisabled();

    fireEvent.press(screen.getByText("Car"));
    expect(saveButton()).toBeEnabled();
  });

  it("sends only the changed fields, with the plate normalised", () => {
    render(<VehicleScreen />);
    fireEvent.changeText(screen.getByDisplayValue("AS-1234-21"), "  gr  55-24 ");
    fireEvent.press(saveButton());

    expect(mutate).toHaveBeenCalledWith({ plateNumber: "GR 55-24" }, expect.any(Object));
  });

  it("sends a vehicle type change", () => {
    render(<VehicleScreen />);
    fireEvent.press(screen.getByText("Van"));
    fireEvent.press(saveButton());

    expect(mutate).toHaveBeenCalledWith({ vehicleType: "van" }, expect.any(Object));
  });

  it("blocks an invalid plate", () => {
    render(<VehicleScreen />);
    fireEvent.changeText(screen.getByDisplayValue("AS-1234-21"), "A");

    expect(screen.getByText("Use 3–20 letters, numbers, spaces or dashes.")).toBeTruthy();
    expect(saveButton()).toBeDisabled();
  });

  it("goes back after a successful save", () => {
    mutate.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<VehicleScreen />);
    fireEvent.press(screen.getByText("Car"));
    fireEvent.press(saveButton());

    expect(mockBack).toHaveBeenCalled();
  });

  it("stays on the screen when saving fails", () => {
    mutate.mockImplementation((_payload, { onError }) => onError(new Error("offline")));
    render(<VehicleScreen />);
    fireEvent.press(screen.getByText("Car"));
    fireEvent.press(saveButton());

    expect(mockBack).not.toHaveBeenCalled();
  });

  it("focuses the plate field when opened from the Licence plate row", () => {
    mockParams = { field: "plate" };
    render(<VehicleScreen />);
    expect(screen.getByDisplayValue("AS-1234-21").props.autoFocus).toBe(true);
  });
});
