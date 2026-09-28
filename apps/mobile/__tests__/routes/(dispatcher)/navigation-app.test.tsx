import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import NavigationAppScreen from "../../../app/(dispatcher)/navigation-app";
import { useNavigationApp } from "@/lib/stores/navigation-app-store";

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

describe("NavigationAppScreen", () => {
  beforeEach(() => {
    useNavigationApp.setState({ app: "google" });
  });

  it("marks the saved app as selected", () => {
    render(<NavigationAppScreen />);
    expect(screen.getByRole("radio", { name: "Google Maps" }).props.accessibilityState).toEqual({
      checked: true,
    });
    expect(screen.getByRole("radio", { name: "Waze" }).props.accessibilityState).toEqual({
      checked: false,
    });
  });

  it("saves the app the rider picks", () => {
    render(<NavigationAppScreen />);
    fireEvent.press(screen.getByText("Waze"));

    expect(useNavigationApp.getState().app).toBe("waze");
    expect(screen.getByRole("radio", { name: "Waze" }).props.accessibilityState).toEqual({
      checked: true,
    });
  });
});
