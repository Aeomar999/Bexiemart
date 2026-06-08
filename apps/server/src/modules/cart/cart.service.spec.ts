import { CartService } from "./cart.service";
import { mockPrisma } from "../../prisma/prisma.mock";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("CartService", () => {
  let service: CartService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new CartService(prisma as any);
  });

  describe("getCart", () => {
    it("should create cart if not found", async () => {
      prisma.cart.findUnique.mockResolvedValue(null);
      const createdCart = { id: "cart1", userId: "u1", items: [] };
      prisma.cart.create.mockResolvedValue(createdCart);
      const result = await service.getCart("u1");
      expect(prisma.cart.create).toHaveBeenCalled();
      expect(result).toEqual({ items: [], itemCount: 0, subtotal: 0 });
    });

    it("should return mapped response with itemCount and subtotal", async () => {
      const cart = {
        id: "cart1",
        userId: "u1",
        items: [
          {
            id: "ci1",
            productId: "p1",
            productName: "Product 1",
            price: 100,
            quantity: 2,
            product: { stock: 10, images: [{ url: "img1.jpg", order: 0 }] },
          },
          {
            id: "ci2",
            productId: "p2",
            productName: "Product 2",
            price: 50,
            quantity: 3,
            product: { stock: 5, images: [] },
          },
        ],
      };
      prisma.cart.findUnique.mockResolvedValue(cart);
      const result = await service.getCart("u1");
      expect(result.itemCount).toBe(5);
      expect(result.subtotal).toBe(350);
      expect(result.items[0]).toEqual({
        id: "ci1",
        productId: "p1",
        name: "Product 1",
        price: 100,
        quantity: 2,
        imageUrl: "img1.jpg",
        stock: 10,
        vendorId: null,
        vendorName: "Unknown Store",
      });
    });
  });

  describe("addItem", () => {
    it("should throw NotFoundException if product missing", async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.addItem("u1", "p1", 1)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if insufficient stock", async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: "p1",
        name: "Test",
        price: 100,
        stock: 0,
        isActive: true,
        isDeleted: false,
      });
      await expect(service.addItem("u1", "p1", 1)).rejects.toThrow(BadRequestException);
    });

    it("should update quantity on existing item", async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: "p1",
        name: "Product 1",
        price: 100,
        stock: 10,
        isActive: true,
        isDeleted: false,
      });
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart1",
        userId: "u1",
        items: [
          {
            id: "ci1",
            productId: "p1",
            productName: "Product 1",
            price: 100,
            quantity: 1,
            product: { stock: 10, images: [] },
          },
        ],
      });
      await service.addItem("u1", "p1", 2);
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: "ci1" },
        data: { quantity: 3, price: 100 },
      });
    });

    it("should create new cart item", async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: "p1",
        name: "Product 1",
        price: 100,
        stock: 10,
        isActive: true,
        isDeleted: false,
      });
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart1",
        userId: "u1",
        items: [],
      });
      await service.addItem("u1", "p1", 2);
      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: "cart1",
          productId: "p1",
          productName: "Product 1",
          price: 100,
          quantity: 2,
        },
      });
    });
  });

  describe("updateItem", () => {
    it("should throw NotFoundException if item not found", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart1",
        userId: "u1",
        items: [],
      });
      await expect(service.updateItem("u1", "nonexistent", 2)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if stock insufficient", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart1",
        userId: "u1",
        items: [{ id: "ci1", productId: "p1", quantity: 1, product: null }],
      });
      prisma.product.findUnique.mockResolvedValue({ id: "p1", stock: 1 });
      await expect(service.updateItem("u1", "ci1", 5)).rejects.toThrow(BadRequestException);
    });

    it("should update quantity", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart1",
        userId: "u1",
        items: [{ id: "ci1", productId: "p1", quantity: 1 }],
      });
      prisma.product.findUnique.mockResolvedValue({ id: "p1", stock: 10 });
      await service.updateItem("u1", "ci1", 3);
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: "ci1" },
        data: { quantity: 3 },
      });
    });
  });

  describe("removeItem", () => {
    it("should throw NotFoundException if item not found", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart1",
        userId: "u1",
        items: [],
      });
      await expect(service.removeItem("u1", "nonexistent")).rejects.toThrow(NotFoundException);
    });

    it("should delete item", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart1",
        userId: "u1",
        items: [{ id: "ci1", productId: "p1", quantity: 1 }],
      });
      await service.removeItem("u1", "ci1");
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: "ci1" } });
    });
  });
});
