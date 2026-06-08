import { loginSchema, registerSchema, addressSchema, checkoutSchema, transferSchema, productSchema, shopSchema } from "./schemas";

describe("Shared Schemas", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const result = loginSchema.safeParse({ email: "user@test.com", password: "abcdef" });
      expect(result.success).toBe(true);
    });

    it("should reject empty email", () => {
      const result = loginSchema.safeParse({ email: "", password: "abcdef" });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should validate correct register data", () => {
      const result = registerSchema.safeParse({
        email: "user@test.com",
        password: "abcdef",
        name: "Jane",
        confirmPassword: "abcdef",
      });
      expect(result.success).toBe(true);
    });

    it("should reject mismatched passwords", () => {
      const result = registerSchema.safeParse({
        email: "user@test.com",
        password: "abcdef",
        name: "Jane",
        confirmPassword: "wrong",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("addressSchema", () => {
    it("should validate correct address data", () => {
      const result = addressSchema.safeParse({
        type: "Work",
        name: "Jane",
        address: "456 Oak St",
        city: "Chicago",
        phone: "555-0100",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const result = addressSchema.safeParse({ type: "Home" });
      expect(result.success).toBe(false);
    });
  });

  describe("checkoutSchema", () => {
    it("should validate correct checkout data", () => {
      const result = checkoutSchema.safeParse({
        name: "Jane",
        phone: "1234567890",
        address: "456 Oak St",
        city: "Chicago",
        deliveryMethod: "express",
        paymentMethod: "credit_card",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing payment method", () => {
      const result = checkoutSchema.safeParse({
        name: "Jane",
        phone: "1234567890",
        address: "456 Oak St",
        city: "Chicago",
        deliveryMethod: "express",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("transferSchema", () => {
    it("should validate correct transfer data", () => {
      const result = transferSchema.safeParse({
        recipient: "vendor@test.com",
        amount: 250,
        pin: "5678",
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative amount", () => {
      const result = transferSchema.safeParse({
        recipient: "vendor@test.com",
        amount: -10,
        pin: "5678",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("productSchema", () => {
    it("should validate correct product data", () => {
      const result = productSchema.safeParse({
        name: "Widget",
        price: 19.99,
        stock: 100,
        category: "Gadgets",
        description: "A handy widget",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero price", () => {
      const result = productSchema.safeParse({
        name: "Widget",
        price: 0,
        stock: 5,
        category: "Gadgets",
        description: "Test",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("shopSchema", () => {
    it("should validate correct shop data", () => {
      const result = shopSchema.safeParse({
        shopName: "Jane's Shop",
        description: "Quality goods",
        phone: "555-0200",
        address: "789 Pine Rd",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty description", () => {
      const result = shopSchema.safeParse({
        shopName: "Jane's Shop",
        description: "",
        phone: "555-0200",
        address: "789 Pine Rd",
      });
      expect(result.success).toBe(false);
    });
  });
});
