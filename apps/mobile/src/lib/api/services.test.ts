jest.mock("./client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

import { servicesApi } from "./services";
import { apiClient } from "./client";

describe("servicesApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should get services", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [{ id: "svc-1" }] } });
    const result = await servicesApi.getServices({ category: "cleaning" });
    expect(apiClient.get).toHaveBeenCalledWith("/services", { params: { category: "cleaning" } });
    expect(result.data.data).toHaveLength(1);
  });

  it("should get single service", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "svc-1" } });
    const result = await servicesApi.getService("svc-1");
    expect(apiClient.get).toHaveBeenCalledWith("/services/svc-1");
    expect(result.data.id).toBe("svc-1");
  });

  it("should book service", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "booking-1" } });
    const result = await servicesApi.bookService("svc-1", { message: "Please clean" });
    expect(apiClient.post).toHaveBeenCalledWith("/services/svc-1/book", { message: "Please clean" });
    expect(result.data.id).toBe("booking-1");
  });

  it("should cancel booking", async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await servicesApi.cancelBooking("booking-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/services/bookings/booking-1");
  });
});
