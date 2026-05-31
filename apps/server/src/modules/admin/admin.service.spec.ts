import { NotFoundException } from "@nestjs/common";
import { AdminService } from "./admin.service";

const mockPrisma = (): any => ({
  $queryRaw: jest.fn(),
  $transaction: jest.fn((cb: any) => cb(mockPrisma())),
  wallet: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  transaction: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn(), update: jest.fn() },
  product: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  cart: { findUnique: jest.fn(), create: jest.fn() },
  cartItem: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  order: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  orderItem: { findMany: jest.fn(), create: jest.fn() },
  shippingAddress: { create: jest.fn() },
  escrow: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
  vendorProfile: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn() },
  referral: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  referredUser: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
  conversation: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  conversationParticipant: { findMany: jest.fn(), updateMany: jest.fn() },
  message: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
  platformConfig: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
  category: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
});

describe("AdminService", () => {
  let service: AdminService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new AdminService(prisma as any);
  });

  describe("listUsers", () => {
    it("returns paginated users with vendor profiles", async () => {
      const users = [
        { id: "u1", name: "Alice", vendorProfile: { id: "vp1" } },
        { id: "u2", name: "Bob", vendorProfile: null },
      ];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.listUsers(1, 10);
      expect(result.data).toEqual(users);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe("getUser", () => {
    it("throws NotFoundException if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUser("u1")).rejects.toThrow(NotFoundException);
    });

    it("returns user with relations", async () => {
      const user = { id: "u1", name: "Alice", orders: [], payments: [], wallet: {}, vendorProfile: {} };
      prisma.user.findUnique.mockResolvedValue(user);
      const result = await service.getUser("u1");
      expect(result).toEqual(user);
    });
  });

  describe("updateUserRole", () => {
    it("throws NotFoundException if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateUserRole("u1", "ADMIN")).rejects.toThrow(NotFoundException);
    });

    it("updates user role", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "u1", role: "USER" });
      prisma.user.update.mockResolvedValue({ id: "u1", role: "ADMIN" });

      const result = await service.updateUserRole("u1", "ADMIN");
      expect(result.role).toBe("ADMIN");
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" }, data: { role: "ADMIN" } })
      );
    });
  });

  describe("approveVendor", () => {
    it("throws NotFoundException if vendor not found", async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);
      await expect(service.approveVendor("vp1")).rejects.toThrow(NotFoundException);
    });

    it("sets isActive to true", async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: "vp1", isActive: false });
      prisma.vendorProfile.update.mockResolvedValue({ id: "vp1", isActive: true });

      const result = await service.approveVendor("vp1");
      expect(result.isActive).toBe(true);
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "vp1" }, data: { isActive: true } })
      );
    });
  });

  describe("suspendVendor", () => {
    it("throws NotFoundException if vendor not found", async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);
      await expect(service.suspendVendor("vp1")).rejects.toThrow(NotFoundException);
    });

    it("sets isActive to false", async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: "vp1", isActive: true });
      prisma.vendorProfile.update.mockResolvedValue({ id: "vp1", isActive: false });

      const result = await service.suspendVendor("vp1");
      expect(result.isActive).toBe(false);
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "vp1" }, data: { isActive: false } })
      );
    });
  });

  describe("listOrders", () => {
    it("returns paginated orders", async () => {
      const orders = [
        { id: "o1", user: { name: "Alice" }, items: [] },
        { id: "o2", user: { name: "Bob" }, items: [] },
      ];
      prisma.order.findMany.mockResolvedValue(orders);
      prisma.order.count.mockResolvedValue(2);

      const result = await service.listOrders(undefined, 1, 10);
      expect(result.data).toEqual(orders);
      expect(result.meta.total).toBe(2);
    });

    it("optionally filters by status", async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.listOrders("pending", 1, 20);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "pending" } })
      );
    });
  });

  describe("getOrder", () => {
    it("throws NotFoundException if order not found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.getOrder("o1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateOrderStatus", () => {
    it("throws NotFoundException if order not found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.updateOrderStatus("o1", "shipped")).rejects.toThrow(NotFoundException);
    });

    it("updates order status", async () => {
      prisma.order.findUnique.mockResolvedValue({ id: "o1", status: "pending" });
      prisma.order.update.mockResolvedValue({ id: "o1", status: "shipped" });

      const result = await service.updateOrderStatus("o1", "shipped");
      expect(result.status).toBe("shipped");
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "o1" }, data: { status: "shipped" } })
      );
    });
  });
});
