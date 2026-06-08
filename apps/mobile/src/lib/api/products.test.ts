jest.mock("./client", () => ({
  apiClient: { get: jest.fn() },
}));

import { productsApi } from "./products";
import { apiClient } from "./client";

describe("productsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch products", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "1" }] } });
    const result = await productsApi.getProducts({ category: "electronics" });
    expect(apiClient.get).toHaveBeenCalledWith("/products", { params: { category: "electronics" } });
    expect(result.data.data).toHaveLength(1);
  });

  it("should fetch single product", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "1", name: "Product" } });
    const result = await productsApi.getProduct("1");
    expect(apiClient.get).toHaveBeenCalledWith("/products/1");
    expect(result.data.name).toBe("Product");
  });

  it("should fetch categories", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ name: "Electronics" }] } });
    const result = await productsApi.getCategories();
    expect(apiClient.get).toHaveBeenCalledWith("/products/categories");
    expect(result.data.data).toHaveLength(1);
  });
});
