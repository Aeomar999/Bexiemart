import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/notifications", () => ({
  notificationsApi: {
    getAll: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  },
}));;

import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "../use-notifications";
import { notificationsApi } from "../../api/notifications";
import { createWrapper } from "./test-utils";

describe("useNotifications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch notifications on mount", async () => {
    (notificationsApi.getAll as jest.Mock).mockResolvedValue({ data: { data: [{ id: "n1", title: "New Order" }] } });
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return notifications on success", async () => {
    (notificationsApi.getAll as jest.Mock).mockResolvedValue({ data: { data: [{ id: "n1", title: "New Order" }] } });
    const { result} = renderHook(() => useNotifications(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "n1", title: "New Order" }]);
  });

  it("should handle empty notifications", async () => {
    (notificationsApi.getAll as jest.Mock).mockResolvedValue({ data: { data: [] } });
    const { result} = renderHook(() => useNotifications(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (notificationsApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useNotifications(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useMarkNotificationRead", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call markAsRead with notification id", async () => {
    (notificationsApi.markAsRead as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useMarkNotificationRead(), { wrapper: createWrapper() });
    await result.current.mutateAsync("n1");
    expect(notificationsApi.markAsRead).toHaveBeenCalledWith("n1");
  });

  it("should handle mark as read error", async () => {
    (notificationsApi.markAsRead as jest.Mock).mockRejectedValue(new Error("Not found"));
    const { result} = renderHook(() => useMarkNotificationRead(), { wrapper: createWrapper() });
    result.current.mutate("n1");
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useMarkAllRead", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call markAllAsRead", async () => {
    (notificationsApi.markAllAsRead as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useMarkAllRead(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(notificationsApi.markAllAsRead).toHaveBeenCalled();
  });
});
