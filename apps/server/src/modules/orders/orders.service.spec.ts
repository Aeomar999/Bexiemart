import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { mockPrisma } from "../../prisma/prisma.mock";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof mockPrisma>;
  let delivery: { quoteForOrderDraft: jest.Mock; createJobForOrder: jest.Mock };

  beforeEach(() => {
    prisma = mockPrisma();
    // Default: no distance quote available → flat-fee fallback, keeping the
    // existing shippingFee assertions valid.
    delivery = {
      quoteForOrderDraft: jest.fn().mockResolvedValue(null),
      createJobForOrder: jest.fn(),
    };
    service = new OrdersService(prisma as any, delivery as any);
  });

  describe("create", () => {
    it("should throw BadRequestException if cart empty", async () => {
      const dto = new CreateOrderDto();
      dto.shippingAddress = {
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        email: "john@test.com",
        address: "123 St",
        city: "Accra",
        state: "GA",
      };
      prisma.cart.findUnique.mockResolvedValue(null);
      await expect(service.create("u1", dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if product not found", async () => {
      const dto = new CreateOrderDto();
      dto.shippingAddress = {
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        email: "john@test.com",
        address: "123 St",
        city: "Accra",
        state: "GA",
      };
      dto.items = [{ productId: "p1", quantity: 1, price: 100 }];
      prisma.product.findMany.mockResolvedValue([]);
      await expect(service.create("u1", dto)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if product unavailable", async () => {
      const dto = new CreateOrderDto();
      dto.shippingAddress = {
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        email: "john@test.com",
        address: "123 St",
        city: "Accra",
        state: "GA",
      };
      dto.items = [{ productId: "p1", quantity: 1, price: 100 }];
      prisma.product.findMany.mockResolvedValue([
        {
          id: "p1",
          name: "Old Product",
          slug: "old-product",
          price: 100,
          isActive: false,
          isDeleted: false,
          stock: 10,
        },
      ]);
      await expect(service.create("u1", dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if insufficient stock", async () => {
      const dto = new CreateOrderDto();
      dto.shippingAddress = {
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        email: "john@test.com",
        address: "123 St",
        city: "Accra",
        state: "GA",
      };
      dto.items = [{ productId: "p1", quantity: 10, price: 100 }];
      prisma.product.findMany.mockResolvedValue([
        {
          id: "p1",
          name: "Test",
          slug: "test",
          price: 100,
          isActive: true,
          isDeleted: false,
          stock: 5,
        },
      ]);
      await expect(service.create("u1", dto)).rejects.toThrow(BadRequestException);
    });

    it("should calculate shipping fee, tax, total and create order with $transaction", async () => {
      const dto = new CreateOrderDto();
      dto.shippingAddress = {
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        email: "john@test.com",
        address: "123 St",
        city: "Accra",
        state: "GA",
      };
      // Client sends tampered prices (1 each). The server must ignore these
      // and price the order from the database rows below (2000 and 1500).
      dto.items = [
        { productId: "p1", quantity: 2, price: 1 },
        { productId: "p2", quantity: 1, price: 1 },
      ];

      // Single findMany now returns all requested rows; line items are built in
      // the requested order regardless of the array order returned here.
      prisma.product.findMany.mockResolvedValue([
        {
          id: "p1",
          name: "Product 1",
          slug: "product-1",
          price: 2000,
          isActive: true,
          isDeleted: false,
          stock: 10,
          images: [],
        },
        {
          id: "p2",
          name: "Product 2",
          slug: "product-2",
          price: 1500,
          isActive: true,
          isDeleted: false,
          stock: 5,
          images: [],
        },
      ]);

      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));

      prisma.shippingAddress.create.mockResolvedValue({ id: "addr1" });
      prisma.order.create.mockResolvedValue({
        id: "order1",
        orderNumber: "BEX-TEST-1234",
        userId: "u1",
        subtotal: 5500,
        shippingFee: 0,
        tax: 412.5,
        total: 5912.5,
        items: [
          {
            productId: "p1",
            productName: "",
            productSlug: "",
            price: 2000,
            quantity: 2,
            total: 4000,
            imageUrl: undefined,
          },
          {
            productId: "p2",
            productName: "",
            productSlug: "",
            price: 1500,
            quantity: 1,
            total: 1500,
            imageUrl: undefined,
          },
        ],
        shippingAddress: { id: "addr1" },
      });

      const result = await service.create("u1", dto);
      expect(result.subtotal).toBe(5500);
      expect(result.shippingFee).toBe(0);
      expect(result.tax).toBe(412.5);
      expect(result.total).toBe(5912.5);
      expect(prisma.shippingAddress.create).toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalled();
      // Stock is decremented via a guarded updateMany (stock >= quantity),
      // not an unconditional update, to prevent overselling.
      expect(prisma.product.updateMany).toHaveBeenCalledTimes(2);

      // The order must be priced from the database, not the tampered DTO prices.
      const orderArgs = prisma.order.create.mock.calls[0][0];
      expect(orderArgs.data.subtotal).toBe(5500);
      const createdItems = orderArgs.data.items.create;
      expect(createdItems[0].price).toBe(2000);
      expect(createdItems[1].price).toBe(1500);
    });
  });

  describe("findAll", () => {
    it("should return orders for user", async () => {
      const orders = [{ id: "o1", userId: "u1", total: 100, items: [], shippingAddress: {} }];
      prisma.order.findMany.mockResolvedValue(orders);
      prisma.order.count.mockResolvedValue(1);
      const result = await service.findAll("u1");
      expect(result).toEqual({
        data: orders,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
        include: { items: true, shippingAddress: true },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 20,
      });
    });
  });

  describe("findOne", () => {
    it("should throw NotFoundException if not found", async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.findOne("u1", "o1")).rejects.toThrow(NotFoundException);
    });

    it("should return order with relations", async () => {
      const order = {
        id: "o1",
        userId: "u1",
        items: [{ id: "oi1", product: { images: [] } }],
        shippingAddress: { id: "addr1" },
        payment: { id: "pay1" },
      };
      prisma.order.findFirst.mockResolvedValue(order);
      const result = await service.findOne("u1", "o1");
      expect(result).toEqual(order);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: "o1", userId: "u1" },
        include: {
          items: {
            include: { product: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
          },
          shippingAddress: true,
          payment: true,
        },
      });
    });
  });
});
