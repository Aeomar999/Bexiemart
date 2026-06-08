jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

import { vendorDocumentsApi, vendorAnalyticsApi } from "./vendor-documents";
import { apiClient } from "./client";

describe("vendorDocumentsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get all documents", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "doc-1" }] } });
    const result = await vendorDocumentsApi.getAll();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/documents");
    expect(result.data.data).toHaveLength(1);
  });

  it("should create document", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "doc-1" } });
    const result = await vendorDocumentsApi.create({ name: "License", file: "url" });
    expect(apiClient.post).toHaveBeenCalledWith("/vendor/documents", { name: "License", file: "url" });
    expect(result.data.id).toBe("doc-1");
  });

  it("should remove document", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await vendorDocumentsApi.remove("doc-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/vendor/documents/doc-1");
  });
});

describe("vendorAnalyticsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get analytics", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { revenue: 1000 } });
    const result = await vendorAnalyticsApi.getAnalytics();
    expect(apiClient.get).toHaveBeenCalledWith("/vendor/earnings/analytics");
    expect(result.data.revenue).toBe(1000);
  });

  it("should handle error", async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(vendorAnalyticsApi.getAnalytics()).rejects.toThrow("Network error");
  });
});
