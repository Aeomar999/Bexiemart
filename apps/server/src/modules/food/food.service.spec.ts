import { mockPrisma } from "../../prisma/prisma.mock";
import { FoodService } from "./food.service";
import { BadRequestException } from "@nestjs/common";

describe("FoodService", () => {
  let service: FoodService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    const delivery = {
      quoteForOrderDraft: jest.fn().mockResolvedValue(null),
      createJobForFoodOrder: jest.fn(),
    };
    service = new FoodService(prisma as any, delivery as any);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should get restaurants with pagination", async () => {
    prisma.vendorProfile.findMany.mockResolvedValue([]);
    prisma.vendorProfile.count.mockResolvedValue(0);
    const result = await service.getRestaurants();
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it("should get a single restaurant", async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({
      id: "vp-1",
      shopName: "Test Kitchen",
      foodItems: [],
      hours: [],
    } as any);
    const result = await service.getRestaurant("vp-1");
    expect(result.shopName).toBe("Test Kitchen");
  });

  it("should throw when restaurant not found", async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue(null);
    await expect(service.getRestaurant("bad")).rejects.toThrow("Restaurant not found");
  });

  it("should get food items with search", async () => {
    prisma.foodItem.findMany.mockResolvedValue([]);
    prisma.foodItem.count.mockResolvedValue(0);
    const result = await service.getFoodItems();
    expect(result.data).toEqual([]);
  });

  it("should add to cart (new cart)", async () => {
    prisma.foodItem.findUnique.mockResolvedValue({
      id: "fi-1",
      vendorId: "vp-1",
      name: "Pizza",
      price: 20,
    } as any);
    prisma.foodCart.findUnique.mockResolvedValue(null);
    prisma.foodCart.create.mockResolvedValue({ id: "fc-1", items: [] } as any);
    prisma.foodCartItem.create.mockResolvedValue({} as any);
    prisma.foodCart.findUnique.mockResolvedValue({
      items: [],
      itemCount: 0,
      subtotal: 0,
    } as any);
    const result = await service.addToCart("user-1", "fi-1", 1);
    expect(result).toBeDefined();
  });

  it("should checkout cart successfully when all items are available", async () => {
    prisma.foodCart.findUnique.mockResolvedValue({
      id: "fc-1",
      vendorId: "vp-1",
      items: [{ id: "i-1", foodItemId: "fi-1", name: "Pizza", price: 20, quantity: 2 }],
      vendor: {},
    } as any);
    prisma.foodItem.findMany.mockResolvedValue([
      { id: "fi-1", name: "Pizza", price: 20, isActive: true, isAvailable: true },
    ] as any);
    prisma.foodOrder.create.mockResolvedValue({ id: "fo-1" } as any);
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    const result = await service.checkout("user-1");
    expect(result).toBeDefined();
    expect(prisma.foodItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["fi-1"] } } })
    );
    expect(prisma.foodOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({
                foodItemId: "fi-1",
                price: 20,
                quantity: 2,
              }),
            ]),
          },
        }),
      })
    );
  });

  it("should throw BadRequestException when cart contains unavailable items (unpublished: isActive=false)", async () => {
    prisma.foodCart.findUnique.mockResolvedValue({
      id: "fc-1",
      vendorId: "vp-1",
      items: [
        { id: "i-1", foodItemId: "fi-1", name: "Pizza", price: 20, quantity: 2 },
        { id: "i-2", foodItemId: "fi-2", name: "Burger", price: 15, quantity: 1 },
      ],
      vendor: {},
    } as any);
    prisma.foodItem.findMany.mockResolvedValue([
      { id: "fi-1", name: "Pizza", price: 20, isActive: true, isAvailable: true },
      { id: "fi-2", name: "Burger", price: 15, isActive: false, isAvailable: true },
    ] as any);
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    await expect(service.checkout("user-1")).rejects.toThrow(
      new BadRequestException("The following items are no longer available: Burger")
    );
    // Cart should survive: order not created, cart items not deleted
    expect(prisma.foodOrder.create).not.toHaveBeenCalled();
    expect(prisma.foodCartItem.deleteMany).not.toHaveBeenCalled();
  });

  it("should throw BadRequestException when cart contains sold-out items (isAvailable=false, isActive=true)", async () => {
    prisma.foodCart.findUnique.mockResolvedValue({
      id: "fc-1",
      vendorId: "vp-1",
      items: [
        { id: "i-1", foodItemId: "fi-1", name: "Pizza", price: 20, quantity: 2 },
        { id: "i-2", foodItemId: "fi-2", name: "Burger", price: 15, quantity: 1 },
      ],
      vendor: {},
    } as any);
    prisma.foodItem.findMany.mockResolvedValue([
      { id: "fi-1", name: "Pizza", price: 20, isActive: true, isAvailable: true },
      { id: "fi-2", name: "Burger", price: 15, isActive: true, isAvailable: false },
    ] as any);
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    await expect(service.checkout("user-1")).rejects.toThrow(
      new BadRequestException("The following items are no longer available: Burger")
    );
    // Cart should survive: order not created, cart items not deleted
    expect(prisma.foodOrder.create).not.toHaveBeenCalled();
    expect(prisma.foodCartItem.deleteMany).not.toHaveBeenCalled();
  });

  it("should throw BadRequestException when cart contains items that no longer exist", async () => {
    prisma.foodCart.findUnique.mockResolvedValue({
      id: "fc-1",
      vendorId: "vp-1",
      items: [{ id: "i-1", foodItemId: "fi-1", name: "Pizza", price: 20, quantity: 1 }],
      vendor: {},
    } as any);
    prisma.foodItem.findMany.mockResolvedValue([] as any);
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    await expect(service.checkout("user-1")).rejects.toThrow(
      new BadRequestException("The following items are no longer available: Pizza")
    );
    expect(prisma.foodOrder.create).not.toHaveBeenCalled();
    expect(prisma.foodCartItem.deleteMany).not.toHaveBeenCalled();
  });

  it("should use current FoodItem price (not stale cart price) when checking out", async () => {
    prisma.foodCart.findUnique.mockResolvedValue({
      id: "fc-1",
      vendorId: "vp-1",
      items: [{ id: "i-1", foodItemId: "fi-1", name: "Pizza", price: 20, quantity: 2 }],
      vendor: {},
    } as any);
    prisma.foodItem.findMany.mockResolvedValue([
      { id: "fi-1", name: "Pizza", price: 25, isActive: true, isAvailable: true },
    ] as any);
    prisma.foodOrder.create.mockResolvedValue({ id: "fo-1" } as any);
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    await service.checkout("user-1");
    expect(prisma.foodOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 50, // 25 * 2 (current price), not 40 (stale cart price)
          total: 50,
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({
                price: 25,
                total: 50,
              }),
            ]),
          },
        }),
      })
    );
  });

  it("should flag unavailable items in getCart response", async () => {
    prisma.foodCart.findUnique.mockResolvedValue({
      id: "fc-1",
      vendorId: "vp-1",
      items: [
        {
          id: "i-1",
          foodItemId: "fi-1",
          name: "Pizza",
          price: 20,
          quantity: 1,
          specialInstructions: null,
          foodItem: {
            imageUrl: "img.jpg",
            prepTime: 10,
            isActive: true,
            isAvailable: true,
            price: 20,
            name: "Pizza",
          },
        },
        {
          id: "i-2",
          foodItemId: "fi-2",
          name: "Burger",
          price: 15,
          quantity: 1,
          specialInstructions: null,
          foodItem: {
            imageUrl: "img2.jpg",
            prepTime: 5,
            isActive: false,
            isAvailable: false,
            price: 18,
            name: "Burger Deluxe",
          },
        },
      ],
      vendor: { id: "vp-1", shopName: "Test Kitchen", logo: "logo.jpg", latitude: 0, longitude: 0 },
    } as any);
    const result = await service.getCart("user-1");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].isAvailable).toBe(true);
    expect(result.items[0].price).toBe(20); // current price from foodItem
    expect(result.items[0].name).toBe("Pizza");
    expect(result.items[1].isAvailable).toBe(false);
    expect(result.items[1].price).toBe(18); // current price from foodItem (updated from 15)
    expect(result.items[1].name).toBe("Burger Deluxe"); // current name from foodItem
  });

  it("should return current FoodItem price in getCart when price has changed", async () => {
    prisma.foodCart.findUnique.mockResolvedValue({
      id: "fc-1",
      vendorId: "vp-1",
      items: [
        {
          id: "i-1",
          foodItemId: "fi-1",
          name: "Pizza",
          price: 20,
          quantity: 2,
          specialInstructions: null,
          foodItem: {
            imageUrl: "img.jpg",
            prepTime: 10,
            isActive: true,
            isAvailable: true,
            price: 25,
            name: "Pizza",
          },
        },
      ],
      vendor: { id: "vp-1", shopName: "Test Kitchen", logo: "logo.jpg", latitude: 0, longitude: 0 },
    } as any);
    const result = await service.getCart("user-1");
    expect(result.items[0].price).toBe(25); // current price from foodItem, not stale cart price (20)
    expect(result.subtotal).toBe(50); // 25 * 2
  });
});
