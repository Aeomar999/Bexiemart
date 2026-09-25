import { renderHook, waitFor } from "@testing-library/react-native";
import { createWrapper } from "./test-utils";
import { useActiveDelivery, isActiveDeliveryStatus } from "../use-delivery";
import { deliveryApi } from "../../api/delivery";

jest.mock("../../api/delivery", () => ({
  deliveryApi: { myJobs: jest.fn() },
}));

const mockMyJobs = deliveryApi.myJobs as jest.Mock;

describe("isActiveDeliveryStatus", () => {
  it("treats terminal statuses as inactive", () => {
    expect(isActiveDeliveryStatus("DELIVERED")).toBe(false);
    expect(isActiveDeliveryStatus("CANCELLED")).toBe(false);
    expect(isActiveDeliveryStatus("EXPIRED")).toBe(false);
    expect(isActiveDeliveryStatus("EN_ROUTE_DROPOFF")).toBe(true);
  });
});

describe("useActiveDelivery", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the newest job that is still active", async () => {
    mockMyJobs.mockResolvedValue({
      data: {
        jobs: [
          { id: "j3", status: "DELIVERED" },
          { id: "j2", status: "EN_ROUTE_PICKUP" },
          { id: "j1", status: "PENDING" },
        ],
      },
    });

    const { result } = renderHook(() => useActiveDelivery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("j2");
  });

  it("returns null when every job has finished", async () => {
    mockMyJobs.mockResolvedValue({ data: { jobs: [{ id: "j1", status: "CANCELLED" }] } });

    const { result } = renderHook(() => useActiveDelivery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("does not fetch when disabled (e.g. guests)", () => {
    renderHook(() => useActiveDelivery({ enabled: false }), { wrapper: createWrapper() });
    expect(mockMyJobs).not.toHaveBeenCalled();
  });
});
