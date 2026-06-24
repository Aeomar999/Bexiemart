import { mockPrisma } from "../../prisma/prisma.mock";
import { FoodService } from "./food.service";

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

  it("should checkout cart", async () => {
    prisma.foodCart.findUnique.mockResolvedValue({
      id: "fc-1",
      vendorId: "vp-1",
      items: [{ id: "i-1", foodItemId: "fi-1", name: "Pizza", price: 20, quantity: 2 }],
      vendor: {},
    } as any);
    prisma.foodOrder.create.mockResolvedValue({ id: "fo-1" } as any);
    // checkout now creates the order + clears the cart inside a transaction;
    // route the interactive transaction back to this configured mock.
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    const result = await service.checkout("user-1");
    expect(result).toBeDefined();
  });
});
