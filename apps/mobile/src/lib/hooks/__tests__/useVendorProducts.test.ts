import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor", () => ({
  vendorApi: {
    getProducts: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  },
}));;

import { useVendorProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "../use-vendor";
import { vendorApi } from "../../api/vendor";
import { createWrapper } from "./test-utils";

describe("useVendorProducts", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch vendor products on mount", async () => {
    (vendorApi.getProducts as jest.Mock).mockResolvedValue({ data: { data: [{ id: "p1", name: "Vendor Product", price: 5000 }] } });
    const { result} = renderHook(() => useVendorProducts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "p1", name: "Vendor Product", price: 5000 }]);
  });

  it("should handle fetch error", async () => {
    (vendorApi.getProducts as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorProducts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useCreateProduct", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create product mutation", async () => {
    (vendorApi.createProduct as jest.Mock).mockResolvedValue({ data: { id: "p2", name: "New Product" } });
    const { result} = renderHook(() => useCreateProduct(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "New Product", price: 10000, category: "electronics" });
    expect(vendorApi.createProduct).toHaveBeenCalledWith({ name: "New Product", price: 10000, category: "electronics" });
  });
});

describe("useUpdateProduct", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update product mutation", async () => {
    (vendorApi.updateProduct as jest.Mock).mockResolvedValue({ data: { id: "p1", name: "Updated" } });
    const { result} = renderHook(() => useUpdateProduct(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "p1", name: "Updated", price: 7500 });
    expect(vendorApi.updateProduct).toHaveBeenCalledWith("p1", { name: "Updated", price: 7500 });
  });
});
