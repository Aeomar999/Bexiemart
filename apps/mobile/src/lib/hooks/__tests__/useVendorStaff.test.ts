import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor-staff", () => ({
  vendorStaffApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
  },
}));;

import { useVendorStaff, useCreateStaff, useUpdateStaff, useDeleteStaff, useToggleStaff } from "../use-vendor-staff";
import { vendorStaffApi } from "../../api/vendor-staff";
import { createWrapper } from "./test-utils";

describe("useVendorStaff", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should list staff members on mount", async () => {
    (vendorStaffApi.getAll as jest.Mock).mockResolvedValue({ data: [{ id: "s1", name: "Staff 1", role: "assistant" }] });
    const { result} = renderHook(() => useVendorStaff(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "s1", name: "Staff 1", role: "assistant" }]);
  });

  it("should handle fetch error", async () => {
    (vendorStaffApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorStaff(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useCreateStaff", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should invite staff member via create mutation", async () => {
    (vendorStaffApi.create as jest.Mock).mockResolvedValue({ data: { id: "s2", name: "New Staff" } });
    const { result} = renderHook(() => useCreateStaff(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "New Staff", email: "staff@test.com", role: "manager" });
    expect(vendorStaffApi.create).toHaveBeenCalledWith({ name: "New Staff", email: "staff@test.com", role: "manager" });
  });
});

describe("useDeleteStaff", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should remove staff member mutation", async () => {
    (vendorStaffApi.remove as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useDeleteStaff(), { wrapper: createWrapper() });
    await result.current.mutateAsync("s1");
    expect(vendorStaffApi.remove).toHaveBeenCalledWith("s1");
  });
});
