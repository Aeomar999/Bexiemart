jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { notificationsApi } from "./notifications";
import { apiClient } from "./client";

describe("notificationsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all notifications", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "1" }] } });
    const result = await notificationsApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/notifications");
    expect(result.data.data).toHaveLength(1);
  });

  it("should get unread count", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { count: 5 } });
    const result = await notificationsApi.getUnreadCount();
    expect(apiClient.get).toHaveBeenCalledWith("/notifications/unread-count");
    expect(result.data.count).toBe(5);
  });

  it("should mark notification as read", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "notif-1", read: true } });
    const result = await notificationsApi.markAsRead("notif-1");
    expect(apiClient.post).toHaveBeenCalledWith("/notifications/notif-1/read");
    expect(result.data.read).toBe(true);
  });

  it("should mark all as read", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    const result = await notificationsApi.markAllAsRead();
    expect(apiClient.post).toHaveBeenCalledWith("/notifications/read-all");
    expect(result.data.success).toBe(true);
  });
});
