import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor-services", () => ({
  vendorServicesApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));;

import { useVendorServices, useCreateService, useUpdateService, useDeleteService } from "../use-vendor-services";
import { vendorServicesApi } from "../../api/vendor-services";
import { createWrapper } from "./test-utils";

describe("useVendorServices", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch vendor services on mount", async () => {
    (vendorServicesApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "s1", name: "Consultation", price: 15000 }] });
    const { result} = renderHook(() => useVendorServices(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "s1", name: "Consultation", price: 15000 }]);
  });

  it("should handle fetch error", async () => {
    (vendorServicesApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorServices(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useCreateService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create service mutation", async () => {
    (vendorServicesApi.create as jest.Mock).mockResolvedValue({ data: { id: "s2", name: "New Service" } });
    const { result} = renderHook(() => useCreateService(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "New Service", price: 20000 });
    expect(vendorServicesApi.create).toHaveBeenCalledWith({ name: "New Service", price: 20000 });
  });
});

describe("useUpdateService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update service mutation", async () => {
    (vendorServicesApi.update as jest.Mock).mockResolvedValue({ data: { id: "s1", name: "Updated Service" } });
    const { result} = renderHook(() => useUpdateService(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "s1", name: "Updated Service", price: 25000 });
    expect(vendorServicesApi.update).toHaveBeenCalledWith("s1", { name: "Updated Service", price: 25000 });
  });
});
