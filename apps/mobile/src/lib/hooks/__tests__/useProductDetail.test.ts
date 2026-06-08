import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/products", () => ({
  productsApi: {
    getProduct: jest.fn(),
    getBySlug: jest.fn(),
  },
}));;

import { useProduct } from "../use-products";
import { productsApi } from "../../api/products";
import { createWrapper } from "./test-utils";

describe("useProductDetail", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch product by id", async () => {
    (productsApi.getProduct as jest.Mock).mockResolvedValue({ data: { id: "1", name: "Product Detail", price: 100 } });
    const { result} = renderHook(() => useProduct("1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(productsApi.getProduct).toHaveBeenCalledWith("1");
    expect(result.current.data).toEqual({ id: "1", name: "Product Detail", price: 100 });
  });

  it("should handle product not found", async () => {
    (productsApi.getProduct as jest.Mock).mockRejectedValue(new Error("Not found"));
    const { result} = renderHook(() => useProduct("999"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });

  it("should handle fetch error", async () => {
    (productsApi.getProduct as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useProduct("1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.isError).toBe(true);
  });

  it("should show loading state initially", async () => {
    (productsApi.getProduct as jest.Mock).mockResolvedValue({ data: { id: "1", name: "Test" } });
    const { result } = renderHook(() => useProduct("1"), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should not fetch when id is empty", () => {
    (productsApi.getProduct as jest.Mock).mockResolvedValue({ data: { id: "1" } });
    renderHook(() => useProduct(""), { wrapper: createWrapper() });
    expect(productsApi.getProduct).not.toHaveBeenCalled();
  });

  it("should return data on successful fetch", async () => {
    (productsApi.getProduct as jest.Mock).mockResolvedValue({ data: { id: "2", name: "Another", price: 50 } });
    const { result} = renderHook(() => useProduct("2"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data.name).toBe("Another");
  });
});
