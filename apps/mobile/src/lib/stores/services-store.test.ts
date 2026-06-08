jest.mock("../api/services", () => ({
  servicesApi: {
    getServices: jest.fn(),
    getBookings: jest.fn(),
    bookService: jest.fn(),
    cancelBooking: jest.fn(),
  },
}));
jest.mock("../logger", () => ({ logger: { error: jest.fn() } }));

import { useServicesStore } from "./services-store";
import { servicesApi } from "../api/services";

const mockProviders = { data: [{ id: "sp1", name: "Electrician Pro", category: "Home", service: "Electrical", rating: 4.8, reviews: 20, price: "GH₵150", about: "Expert", availableTimes: ["10:00"] }] };
const mockBookings = { data: [{ id: "b1", providerId: "sp1", providerName: "Electrician Pro", service: "Electrical", date: "2025-01-15", time: "10:00", address: "123 St", status: "upcoming" as const }] };

describe("Services Store", () => {
  beforeEach(() => {
    useServicesStore.setState({ providers: [], activeBookings: [], isLoading: false });
    jest.clearAllMocks();
  });

  it("should fetch services", async () => {
    (servicesApi.getServices as jest.Mock).mockResolvedValue(mockProviders);
    await useServicesStore.getState().fetchServices();
    expect(useServicesStore.getState().providers).toHaveLength(1);
    expect(useServicesStore.getState().isLoading).toBe(false);
  });

  it("should handle fetch services error", async () => {
    (servicesApi.getServices as jest.Mock).mockRejectedValue(new Error("network"));
    await useServicesStore.getState().fetchServices();
    expect(useServicesStore.getState().isLoading).toBe(false);
  });

  it("should fetch bookings", async () => {
    (servicesApi.getBookings as jest.Mock).mockResolvedValue(mockBookings);
    await useServicesStore.getState().fetchBookings();
    expect(useServicesStore.getState().activeBookings).toHaveLength(1);
  });

  it("should book service and refresh", async () => {
    (servicesApi.bookService as jest.Mock).mockResolvedValue({});
    (servicesApi.getBookings as jest.Mock).mockResolvedValue(mockBookings);
    await useServicesStore.getState().bookService("sp1", { message: "Fix socket" });
    expect(servicesApi.bookService).toHaveBeenCalledWith("sp1", { message: "Fix socket" });
  });

  it("should throw on book error", async () => {
    (servicesApi.bookService as jest.Mock).mockRejectedValue(new Error("unavailable"));
    await expect(useServicesStore.getState().bookService("sp1", {})).rejects.toThrow("unavailable");
  });

  it("should cancel booking and refresh", async () => {
    (servicesApi.cancelBooking as jest.Mock).mockResolvedValue({});
    (servicesApi.getBookings as jest.Mock).mockResolvedValue({ data: [] });
    await useServicesStore.getState().cancelBooking("b1");
    expect(servicesApi.cancelBooking).toHaveBeenCalledWith("b1");
  });

  it("should throw on cancel error", async () => {
    (servicesApi.cancelBooking as jest.Mock).mockRejectedValue(new Error("not found"));
    await expect(useServicesStore.getState().cancelBooking("b1")).rejects.toThrow("not found");
  });
});
