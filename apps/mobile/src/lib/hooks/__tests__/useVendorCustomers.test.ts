import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor-customers", () => ({
  vendorCustomersApi: {
    getAll: jest.fn(),
    getOne: jest.fn(),
  },
}));;

import { useVendorCustomers, useVendorCustomer } from "../use-vendor-customers";
import { vendorCustomersApi } from "../../api/vendor-customers";
import { createWrapper } from "./test-utils";

describe("useVendorCustomers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch vendor customers on mount", async () => {
    (vendorCustomersApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "c1", name: "John Doe", orders: 5 }] });
    const { result} = renderHook(() => useVendorCustomers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "c1", name: "John Doe", orders: 5 }]);
  });

  it("should handle fetch error", async () => {
    (vendorCustomersApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorCustomers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useVendorCustomer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch customer by id", async () => {
    (vendorCustomersApi.getOne as jest.Mock).mockResolvedValue({ data: { id: "c1", name: "John Doe", email: "john@test.com" } });
    const { result} = renderHook(() => useVendorCustomer("c1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(vendorCustomersApi.getOne).toHaveBeenCalledWith("c1");
    expect(result.current.data).toEqual({ id: "c1", name: "John Doe", email: "john@test.com" });
  });
});
