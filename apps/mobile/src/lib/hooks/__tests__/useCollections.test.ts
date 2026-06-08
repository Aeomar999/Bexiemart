import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/collections", () => ({
  collectionsApi: {
    getCollections: jest.fn(),
    getCollection: jest.fn(),
    createCollection: jest.fn(),
    deleteCollection: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));;

import { useCollections, useCollection, useCreateCollection, useDeleteCollection, useAddCollectionItem, useRemoveCollectionItem } from "../use-collections";
import { collectionsApi } from "../../api/collections";
import { createWrapper } from "./test-utils";

describe("useCollections", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch collections on mount", async () => {
    (collectionsApi.getCollections as jest.Mock).mockResolvedValue({ data: { data: [{ id: "c1", name: "Summer" }] } });
    const { result} = renderHook(() => useCollections(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "c1", name: "Summer" }]);
  });

  it("should handle empty collections", async () => {
    (collectionsApi.getCollections as jest.Mock).mockResolvedValue({ data: { data: [] } });
    const { result} = renderHook(() => useCollections(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (collectionsApi.getCollections as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useCollections(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useCollection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch collection by id", async () => {
    (collectionsApi.getCollection as jest.Mock).mockResolvedValue({ data: { data: { id: "c1", name: "Summer", items: [] } } });
    const { result} = renderHook(() => useCollection("c1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(collectionsApi.getCollection).toHaveBeenCalledWith("c1");
    expect(result.current.data).toEqual({ id: "c1", name: "Summer", items: [] });
  });
});
