import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../../api/services", () => ({
  servicesApi: {
    getServices: jest.fn(),
    getService: jest.fn(),
    bookService: jest.fn(),
    getBookings: jest.fn(),
    cancelBooking: jest.fn(),
  },
}));;

import { useServices, useService, useBookService, useServiceBookings, useCancelServiceBooking } from "../use-services";
import { servicesApi } from "../../api/services";
import { createWrapper } from "./test-utils";

describe("useServices", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch services on mount", async () => {
    (servicesApi.getServices as jest.Mock).mockResolvedValue({ data: [{ id: "s1", name: "Cleaning" }] });
    const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
  });

  it("should return services on success", async () => {
    (servicesApi.getServices as jest.Mock).mockResolvedValue({ data: [{ id: "s1", name: "Cleaning", price: 5000 }] });
    const { result} = renderHook(() => useServices(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([{ id: "s1", name: "Cleaning", price: 5000 }]);
  });

  it("should handle empty services", async () => {
    (servicesApi.getServices as jest.Mock).mockResolvedValue({ data: [] });
    const { result} = renderHook(() => useServices(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    (servicesApi.getServices as jest.Mock).mockRejectedValue(new Error("Network Error"));
    const { result} = renderHook(() => useServices(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(result.current.error).toBeDefined();
  });
});

describe("useService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should fetch service by id", async () => {
    (servicesApi.getService as jest.Mock).mockResolvedValue({ data: { id: "s1", name: "Deep Cleaning", price: 10000 } });
    const { result} = renderHook(() => useService("s1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBeFalsy());
    expect(servicesApi.getService).toHaveBeenCalledWith("s1");
    expect(result.current.data).toEqual({ id: "s1", name: "Deep Cleaning", price: 10000 });
  });
});
