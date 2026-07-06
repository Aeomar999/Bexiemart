import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { useColorScheme } from "nativewind";
import { useThemeColors } from "../useThemeColors";
import { getThemeColors, lightTokens, darkTokens } from "../tokens";

function Probe() {
  const c = useThemeColors();
  return <Text>{c.background}</Text>;
}

const asMock = (fn: unknown) => fn as jest.Mock;

describe("getThemeColors", () => {
  it("returns the palette matching the scheme", () => {
    expect(getThemeColors("light")).toBe(lightTokens);
    expect(getThemeColors("dark")).toBe(darkTokens);
  });

  it("exposes the expected surface hexes", () => {
    expect(getThemeColors("light").background).toBe("#F8FAFC");
    expect(getThemeColors("dark").background).toBe("#020617");
    expect(getThemeColors("dark").surface).toBe("#0F172A");
    expect(getThemeColors("dark").textPrimary).toBe("#F8FAFC");
  });
});

describe("useThemeColors", () => {
  afterEach(() => {
    asMock(useColorScheme).mockReturnValue({
      colorScheme: "light",
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    });
  });

  it("returns the light palette by default", () => {
    const { getByText } = render(<Probe />);
    expect(getByText(lightTokens.background)).toBeTruthy();
  });

  it("returns the dark palette when the scheme is dark", () => {
    asMock(useColorScheme).mockReturnValue({
      colorScheme: "dark",
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    });
    const { getByText } = render(<Probe />);
    expect(getByText(darkTokens.background)).toBeTruthy();
  });
});
