import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/addresses", () => ({
  addressesApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
  },
}));;

import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from "../use-addresses";
import { addressesApi } from "../../api/addresses";
import { createWrapper } from "./test-utils";

describe("useAddresses", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch addresses on mount", async () => {
    (addressesApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "a1", street: "123 Main St" }] });
    const { result} = renderHook(() => useAddresses(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "a1", street: "123 Main St" }]);
  });

  it("should handle fetch error", async () => {
    (addressesApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useAddresses(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useCreateAddress", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call create mutation with address data", async () => {
    (addressesApi.create as jest.Mock).mockResolvedValue({ data: { id: "a2", street: "456 Oak Ave" } });
    const { result} = renderHook(() => useCreateAddress(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ street: "456 Oak Ave", city: "Lagos" });
    expect(addressesApi.create).toHaveBeenCalledWith({ street: "456 Oak Ave", city: "Lagos" });
  });
});

describe("useUpdateAddress", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call update mutation with id and data", async () => {
    (addressesApi.update as jest.Mock).mockResolvedValue({ data: { id: "a1", street: "Updated St" } });
    const { result} = renderHook(() => useUpdateAddress(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "a1", street: "Updated St", city: "Abuja" });
    expect(addressesApi.update).toHaveBeenCalledWith("a1", { street: "Updated St", city: "Abuja" });
  });
});

describe("useDeleteAddress", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call remove mutation with address id", async () => {
    (addressesApi.remove as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useDeleteAddress(), { wrapper: createWrapper() });
    await result.current.mutateAsync("a1");
    expect(addressesApi.remove).toHaveBeenCalledWith("a1");
  });
});
