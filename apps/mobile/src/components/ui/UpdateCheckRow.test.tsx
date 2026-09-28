import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import * as Updates from "expo-updates";
import { UpdateCheckRow, getAppVersionLabel } from "./UpdateCheckRow";
import Toast from "@/lib/toast-polyfill";

const mockCheckForUpdate = jest.fn();
const mockApplyUpdate = jest.fn();
const mockState = {
  isChecking: false,
  isDownloading: false,
  isUpdateReady: false,
};

jest.mock("expo-updates", () => ({
  __esModule: true,
  isEnabled: true,
  isEmbeddedLaunch: true,
  updateId: "abcdef12-3456-7890-abcd-ef1234567890",
}));

jest.mock("@/hooks/useOTAUpdate", () => ({
  useOTAUpdate: () => ({
    ...mockState,
    checkForUpdate: mockCheckForUpdate,
    applyUpdate: mockApplyUpdate,
  }),
}));

jest.mock("@/lib/toast-polyfill", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

describe("UpdateCheckRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockState, { isChecking: false, isDownloading: false, isUpdateReady: false });
    Object.assign(Updates, { isEnabled: true, isEmbeddedLaunch: true });
  });

  it("shows the native version when running the embedded bundle", () => {
    expect(getAppVersionLabel()).toBe("1.0.0");
  });

  it("appends the short update id when running an OTA update", () => {
    Object.assign(Updates, { isEmbeddedLaunch: false });
    expect(getAppVersionLabel()).toBe("1.0.0 · abcdef1");
  });

  it("toasts when the app is already up to date", async () => {
    mockCheckForUpdate.mockResolvedValue("up-to-date");
    const { getByText } = render(<UpdateCheckRow />);

    fireEvent.press(getByText("Check for Updates"));

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text1: "Up to date" }))
    );
  });

  it("toasts when the check fails", async () => {
    mockCheckForUpdate.mockResolvedValue("error");
    const { getByText } = render(<UpdateCheckRow />);

    fireEvent.press(getByText("Check for Updates"));

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }))
    );
  });

  it("explains when updates are disabled in this build", async () => {
    Object.assign(Updates, { isEnabled: false });
    mockCheckForUpdate.mockResolvedValue("skipped");
    const { getByText } = render(<UpdateCheckRow />);

    fireEvent.press(getByText("Check for Updates"));

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text1: "Updates unavailable" })
      )
    );
  });

  it("restarts into a downloaded update instead of checking again", async () => {
    mockState.isUpdateReady = true;
    const { getByText } = render(<UpdateCheckRow />);

    fireEvent.press(getByText("Restart to Update"));

    await waitFor(() => expect(mockApplyUpdate).toHaveBeenCalled());
    expect(mockCheckForUpdate).not.toHaveBeenCalled();
  });

  it("is disabled while a check is in flight", () => {
    mockState.isChecking = true;
    const { getByRole } = render(<UpdateCheckRow />);

    fireEvent.press(getByRole("button"));

    expect(mockCheckForUpdate).not.toHaveBeenCalled();
  });
});
