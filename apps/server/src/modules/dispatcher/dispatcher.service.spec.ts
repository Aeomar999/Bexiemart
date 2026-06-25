import { mockPrisma } from "../../prisma/prisma.mock";
import { DispatcherService } from "./dispatcher.service";

describe("DispatcherService", () => {
  let service: DispatcherService;
  let prisma: ReturnType<typeof mockPrisma>;
  let delivery: {
    getAvailableJobs: jest.Mock;
    getDispatcherJobs: jest.Mock;
    acceptJob: jest.Mock;
    updateJobStatus: jest.Mock;
  };

  beforeEach(() => {
    prisma = mockPrisma();
    delivery = {
      getAvailableJobs: jest.fn(),
      getDispatcherJobs: jest.fn(),
      acceptJob: jest.fn(),
      updateJobStatus: jest.fn(),
    };
    service = new DispatcherService(prisma as any, delivery as any);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should get profile", async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: "dp-1", userId: "user-1" } as any);
    const result = await service.getProfile("user-1");
    expect(result.id).toBe("dp-1");
  });

  it("should throw when profile not found", async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue(null);
    await expect(service.getProfile("bad")).rejects.toThrow("Dispatcher profile not found");
  });

  it("should create profile", async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", role: "CUSTOMER" } as any);
    prisma.user.update.mockResolvedValue({} as any);
    prisma.dispatcherProfile.create.mockResolvedValue({ id: "dp-1", vehicleType: "bike" } as any);
    const result = await service.createProfile("user-1", { vehicleType: "bike" });
    expect(result.vehicleType).toBe("bike");
  });

  it("should update status", async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: "dp-1" } as any);
    prisma.dispatcherProfile.update.mockResolvedValue({ status: "ONLINE" } as any);
    const result = await service.updateStatus("user-1", "ONLINE");
    expect(result.status).toBe("ONLINE");
  });

  it("should update location", async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: "dp-1" } as any);
    prisma.dispatcherProfile.update.mockResolvedValue({
      lastLatitude: 5.6,
      lastLongitude: -0.2,
    } as any);
    const result = await service.updateLocation("user-1", 5.6, -0.2);
    expect(result.lastLatitude).toBe(5.6);
  });

  it("should delegate accepting a task to the delivery engine", async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: "dp-1", status: "ONLINE" } as any);
    delivery.acceptJob.mockResolvedValue({ id: "job-1", status: "ASSIGNED" });
    const result = await service.acceptTask("user-1", "job-1");
    expect(delivery.acceptJob).toHaveBeenCalledWith(
      expect.objectContaining({ id: "dp-1" }),
      "job-1"
    );
    expect(result?.status).toBe("ASSIGNED");
  });

  it("should get earnings", async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: "dp-1", pendingPayout: 0 } as any);
    prisma.wallet.findUnique.mockResolvedValue(null);
    const result = await service.getEarnings("user-1");
    expect(result.availableBalance).toBe(0);
  });

  it("should withdraw from cleared balance", async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: "dp-1", pendingPayout: 0 } as any);
    prisma.wallet.findUnique.mockResolvedValue({ id: "w-1", currency: "GHS", balance: 500 } as any);
    prisma.$transaction.mockImplementation(async (args: any) => args);
    const result = await service.withdrawEarnings("user-1", 100, "bank");
    expect(result.success).toBe(true);
  });

  it("should reject withdrawal above available balance", async () => {
    prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: "dp-1", pendingPayout: 0 } as any);
    prisma.wallet.findUnique.mockResolvedValue({ id: "w-1", currency: "GHS", balance: 50 } as any);
    await expect(service.withdrawEarnings("user-1", 100, "bank")).rejects.toThrow(
      "Insufficient available balance"
    );
  });
});
