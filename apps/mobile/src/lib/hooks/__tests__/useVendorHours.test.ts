import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/vendor-hours", () => ({
  vendorHoursApi: {
    getAll: jest.fn(),
    update: jest.fn(),
  },
}));;

import { useVendorHours, useUpdateVendorHours } from "../use-vendor-hours";
import { vendorHoursApi } from "../../api/vendor-hours";
import { createWrapper } from "./test-utils";

describe("useVendorHours", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch business hours on mount", async () => {
    (vendorHoursApi.getAll as jest.Mock).mockResolvedValue({ data: [{ day: "Monday", open: "09:00", close: "17:00" }] });
    const { result} = renderHook(() => useVendorHours(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ day: "Monday", open: "09:00", close: "17:00" }]);
  });

  it("should handle fetch error", async () => {
    (vendorHoursApi.getAll as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useVendorHours(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useUpdateVendorHours", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update business hours mutation", async () => {
    (vendorHoursApi.update as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { result} = renderHook(() => useUpdateVendorHours(), { wrapper: createWrapper() });
    await result.current.mutateAsync([{ day: "Monday", open: "08:00", close: "18:00" }]);
    expect(vendorHoursApi.update).toHaveBeenCalled();
  });
});
