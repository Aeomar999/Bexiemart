import React from "react";
import { render } from "@testing-library/react-native";
import { Appearance } from "react-native";
import { colorScheme } from "nativewind";
import { ThemeController } from "../ThemeController";
import { useThemeStore } from "@/lib/stores/theme-store";

const asMock = (fn: unknown) => fn as jest.Mock;

describe("ThemeController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Neutralize the async AsyncStorage read so tests stay deterministic.
    useThemeStore.setState({ preference: "system", hydrated: false, hydrate: jest.fn() });
    asMock(Appearance.getColorScheme).mockReturnValue("light");
    asMock(Appearance.addChangeListener).mockReturnValue({ remove: jest.fn() });
  });

  it("applies the resolved scheme on mount (system + dark OS -> dark)", () => {
    asMock(Appearance.getColorScheme).mockReturnValue("dark");
    useThemeStore.setState({ preference: "system" });
    render(<ThemeController />);
    expect(colorScheme.set).toHaveBeenCalledWith("dark");
  });

  it("applies the pinned scheme regardless of the OS", () => {
    asMock(Appearance.getColorScheme).mockReturnValue("dark");
    useThemeStore.setState({ preference: "light" });
    render(<ThemeController />);
    expect(colorScheme.set).toHaveBeenCalledWith("light");
  });

  it("follows OS appearance changes only while in system mode", () => {
    let listener: (prefs: { colorScheme: string | null }) => void = () => {};
    asMock(Appearance.addChangeListener).mockImplementation((cb) => {
      listener = cb;
      return { remove: jest.fn() };
    });
    useThemeStore.setState({ preference: "system" });
    render(<ThemeController />);

    asMock(colorScheme.set).mockClear();
    asMock(Appearance.getColorScheme).mockReturnValue("dark");
    listener({ colorScheme: "dark" });
    expect(colorScheme.set).toHaveBeenCalledWith("dark");
  });

  it("ignores OS changes when a scheme is pinned", () => {
    let listener: (prefs: { colorScheme: string | null }) => void = () => {};
    asMock(Appearance.addChangeListener).mockImplementation((cb) => {
      listener = cb;
      return { remove: jest.fn() };
    });
    useThemeStore.setState({ preference: "light" });
    render(<ThemeController />);

    asMock(colorScheme.set).mockClear();
    listener({ colorScheme: "dark" });
    expect(colorScheme.set).not.toHaveBeenCalled();
  });
});
