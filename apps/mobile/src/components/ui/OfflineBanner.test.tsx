import React from "react";
import { render } from "@testing-library/react-native";
import { OfflineBanner } from "./OfflineBanner";

const mockIsConnected = jest.fn(() => true);

jest.mock("@/hooks/useNetwork", () => ({
  useNetwork: jest.fn(() => ({ isConnected: mockIsConnected() })),
}));

describe("OfflineBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when connected", () => {
    mockIsConnected.mockReturnValue(true);
    const { UNSAFE_root } = render(<OfflineBanner />);
    expect(UNSAFE_root.children.length).toBe(0);
  });

  it("renders offline message when not connected", () => {
    mockIsConnected.mockReturnValue(false);
    const { getByText } = render(<OfflineBanner />);
    expect(getByText("No internet connection — some features may be unavailable")).toBeTruthy();
  });
});
