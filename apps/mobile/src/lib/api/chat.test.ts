jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { chatApi } from "./chat";
import { apiClient } from "./client";

describe("chatApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get conversations", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "conv-1" }] } });
    const result = await chatApi.getConversations();
    expect(apiClient.get).toHaveBeenCalledWith("/chat/conversations");
    expect(result.data.data).toHaveLength(1);
  });

  it("should create conversation", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "conv-1" } });
    const result = await chatApi.createConversation("user-1", "order-1");
    expect(apiClient.post).toHaveBeenCalledWith("/chat/conversations", { participantId: "user-1", orderId: "order-1" });
    expect(result.data.id).toBe("conv-1");
  });

  it("should get messages", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ text: "Hello" }] } });
    const result = await chatApi.getMessages("conv-1", 1);
    expect(apiClient.get).toHaveBeenCalledWith("/chat/conversations/conv-1/messages?page=1");
    expect(result.data.data).toHaveLength(1);
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Chat unavailable"));
    await expect(chatApi.getConversations()).rejects.toThrow("Chat unavailable");
  });
});
