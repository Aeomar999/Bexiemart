import { renderHook, act } from "@testing-library/react-native";
import { AppState } from "react-native";
import * as Updates from "expo-updates";
import { useOTAUpdate } from "../useOTAUpdate";

jest.mock("expo-updates", () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@sentry/react-native", () => ({
  captureException: jest.fn(),
}));

describe("useOTAUpdate", () => {
  const originalDev = __DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__DEV__ = false;
  });

  afterAll(() => {
    (global as any).__DEV__ = originalDev;
  });

  it("should check and fetch update when available", async () => {
    (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValue({ isAvailable: true });
    (Updates.fetchUpdateAsync as jest.Mock).mockResolvedValue({ isNew: true });

    const { result } = renderHook(() => useOTAUpdate());

    await act(async () => {
      await result.current.checkForUpdate();
    });

    expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
    expect(Updates.fetchUpdateAsync).toHaveBeenCalled();
    expect(result.current.isUpdateAvailable).toBe(true);
    expect(result.current.isUpdateReady).toBe(true);
  });

  it("should not check for updates when in DEV mode", async () => {
    (global as any).__DEV__ = true;

    const { result } = renderHook(() => useOTAUpdate());

    await act(async () => {
      await result.current.checkForUpdate();
    });

    expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });

  it("should reload app when applyUpdate is called and update is ready", async () => {
    (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValue({ isAvailable: true });
    (Updates.fetchUpdateAsync as jest.Mock).mockResolvedValue({ isNew: true });
    (Updates.reloadAsync as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOTAUpdate());

    await act(async () => {
      await result.current.checkForUpdate();
    });

    await act(async () => {
      await result.current.applyUpdate();
    });

    expect(Updates.reloadAsync).toHaveBeenCalled();
  });
});
