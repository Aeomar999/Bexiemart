jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

import { collectionsApi } from "./collections";
import { apiClient } from "./client";

describe("collectionsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get collections", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "col-1" }] } });
    const result = await collectionsApi.getCollections();
    expect(apiClient.get).toHaveBeenCalledWith("/collections");
    expect(result.data.data).toHaveLength(1);
  });

  it("should create collection", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "col-1" } });
    const result = await collectionsApi.createCollection({ name: "Favorites" });
    expect(apiClient.post).toHaveBeenCalledWith("/collections", { name: "Favorites" });
    expect(result.data.id).toBe("col-1");
  });

  it("should add item to collection", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    const result = await collectionsApi.addItem("col-1", "prod-1");
    expect(apiClient.post).toHaveBeenCalledWith("/collections/col-1/items", { productId: "prod-1" });
    expect(result.data.success).toBe(true);
  });

  it("should delete collection", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await collectionsApi.deleteCollection("col-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/collections/col-1");
  });
});
