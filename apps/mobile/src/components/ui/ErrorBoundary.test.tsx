import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { ErrorBoundary } from "./ErrorBoundary";

jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn() } }));

const mockCheckForUpdateAsync = jest.fn();
const mockFetchUpdateAsync = jest.fn();
const mockReloadAsync = jest.fn();

jest.mock("expo-updates", () => ({
  checkForUpdateAsync: (...args: any[]) => mockCheckForUpdateAsync(...args),
  fetchUpdateAsync: (...args: any[]) => mockFetchUpdateAsync(...args),
  reloadAsync: (...args: any[]) => mockReloadAsync(...args),
}));

const ProblemChild = () => {
  throw new Error("Test error");
};

let shouldThrow = true;
const ConditionalChild = () => {
  if (shouldThrow) throw new Error("Test error");
  return <Text>All good</Text>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders children when no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>All good</Text>
      </ErrorBoundary>
    );
    expect(getByText("All good")).toBeTruthy();
  });

  it("renders error UI when child throws", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(getByText("We hit a snag!")).toBeTruthy();
    expect(getByText("Restart App")).toBeTruthy();
  });

  it("calls expo-updates on restart press", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: true });

    const { getByText } = render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    fireEvent.press(getByText("Restart App"));

    await waitFor(() => {
      expect(mockFetchUpdateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockReloadAsync).toHaveBeenCalledTimes(1);
  });

  it("resets state when no update available", async () => {
    shouldThrow = true;
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>
    );

    expect(getByText("We hit a snag!")).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText("Restart App"));
      shouldThrow = false;
      await Promise.resolve();
    });

    expect(queryByText("We hit a snag!")).toBeNull();
  });
});
