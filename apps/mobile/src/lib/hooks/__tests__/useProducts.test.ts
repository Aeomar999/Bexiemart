import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/products", () => ({
  productsApi: {
    getProducts: jest.fn(),
    getProduct: jest.fn(),
    getStore: jest.fn(),
    getCategories: jest.fn(),
  },
}));

import { useProducts, useProduct, useStoreProfile, useCategories } from "../use-products";
import { productsApi } from "../../api/products";
import { createWrapper } from "./test-utils";

describe("useProducts", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch all products on mount", async () => {
    (productsApi.getProducts as jest.Mock).mockResolvedValue({
      data: { data: [{ id: "1", name: "Test Product" }] },
    });
    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return fetched products on success", async () => {
    (productsApi.getProducts as jest.Mock).mockResolvedValue({
      data: { data: [{ id: "1", name: "Test Product" }] },
    });
    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data?.pages[0].data).toEqual([{ id: "1", name: "Test Product" }]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch with category filter", async () => {
    (productsApi.getProducts as jest.Mock).mockResolvedValue({
      data: { data: [{ id: "2", name: "Electronics", category: "electronics" }] },
    });
    const { result } = renderHook(() => useProducts({ category: "electronics" }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(productsApi.getProducts).toHaveBeenCalledWith({ category: "electronics" });
    expect(result.current.data?.pages[0].data).toEqual([
      { id: "2", name: "Electronics", category: "electronics" },
    ]);
  });

  it("should handle empty product list", async () => {
    (productsApi.getProducts as jest.Mock).mockResolvedValue({ data: { data: [] } });
    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data?.pages[0].data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (productsApi.getProducts as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });

  it("should fetch product by id", async () => {
    (productsApi.getProduct as jest.Mock).mockResolvedValue({
      data: { id: "1", name: "Single Product" },
    });
    const { result } = renderHook(() => useProduct("1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual({ id: "1", name: "Single Product" });
  });
});

describe("useCategories", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch categories on mount", async () => {
    (productsApi.getCategories as jest.Mock).mockResolvedValue({
      data: [{ id: "1", name: "Electronics" }],
    });
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "1", name: "Electronics" }]);
  });
});
