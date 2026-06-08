import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/chat", () => ({
  chatApi: {
    getConversations: jest.fn(),
    getConversation: jest.fn(),
    getMessages: jest.fn(),
    createConversation: jest.fn(),
    markAsRead: jest.fn(),
  },
}));;

import { useConversations, useConversation, useMessages, useCreateConversation, useMarkAsRead } from "../use-chat";
import { chatApi } from "../../api/chat";
import { createWrapper } from "./test-utils";

describe("useConversations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch conversations on mount", async () => {
    (chatApi.getConversations as jest.Mock).mockResolvedValue({ data: [{ id: "c1", participantName: "John" }] });
    const { result } = renderHook(() => useConversations(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return conversations on success", async () => {
    (chatApi.getConversations as jest.Mock).mockResolvedValue({ data: [{ id: "c1", participantName: "John" }] });
    const { result} = renderHook(() => useConversations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "c1", participantName: "John" }]);
  });

  it("should handle empty conversations", async () => {
    (chatApi.getConversations as jest.Mock).mockResolvedValue({ data: [] });
    const { result} = renderHook(() => useConversations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (chatApi.getConversations as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useConversations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useConversation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch single conversation by id", async () => {
    (chatApi.getConversation as jest.Mock).mockResolvedValue({ data: { id: "c1", participantName: "John" } });
    const { result} = renderHook(() => useConversation("c1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(chatApi.getConversation).toHaveBeenCalledWith("c1");
    expect(result.current.data).toEqual({ id: "c1", participantName: "John" });
  });
});

describe("useMessages", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch messages for a conversation", async () => {
    (chatApi.getMessages as jest.Mock).mockResolvedValue({ data: { data: [{ id: "m1", text: "Hello" }] } });
    const { result} = renderHook(() => useMessages("c1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(chatApi.getMessages).toHaveBeenCalledWith("c1", 1);
    expect(result.current.data).toEqual([{ id: "m1", text: "Hello" }]);
  });
});

describe("useCreateConversation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call createConversation with participantId", async () => {
    (chatApi.createConversation as jest.Mock).mockResolvedValue({ data: { id: "c2" } });
    const { result} = renderHook(() => useCreateConversation(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ participantId: "u1" });
    expect(chatApi.createConversation).toHaveBeenCalledWith("u1", undefined);
  });
});
