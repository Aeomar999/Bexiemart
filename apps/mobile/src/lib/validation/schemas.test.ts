import { loginSchema, registerSchema, addressSchema, checkoutSchema, transferSchema, productSchema, shopSchema } from "./schemas";

describe("Validation Schemas", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const result = loginSchema.safeParse({ email: "test@test.com", password: "password123" });
      expect(result.success).toBe(true);
    });

    it("should reject empty email", () => {
      const result = loginSchema.safeParse({ email: "", password: "password123" });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email format", () => {
      const result = loginSchema.safeParse({ email: "notanemail", password: "password123" });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = loginSchema.safeParse({ email: "test@test.com", password: "123" });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should validate correct register data", () => {
      const result = registerSchema.safeParse({
        email: "test@test.com",
        password: "password123",
        name: "John Doe",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing name", () => {
      const result = registerSchema.safeParse({
        email: "test@test.com",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject mismatched passwords", () => {
      const result = registerSchema.safeParse({
        email: "test@test.com",
        password: "password123",
        name: "John",
        confirmPassword: "different",
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional phone", () => {
      const result = registerSchema.safeParse({
        email: "test@test.com",
        password: "password123",
        name: "John",
        confirmPassword: "password123",
        phone: "1234567890",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("addressSchema", () => {
    it("should validate correct address data", () => {
      const result = addressSchema.safeParse({
        type: "Home",
        name: "John",
        address: "123 Main St",
        city: "New York",
        phone: "1234567890",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty city", () => {
      const result = addressSchema.safeParse({
        type: "Home",
        name: "John",
        address: "123 Main St",
        city: "",
        phone: "1234567890",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("checkoutSchema", () => {
    it("should validate correct checkout data", () => {
      const result = checkoutSchema.safeParse({
        name: "John",
        phone: "1234567890",
        address: "123 Main St",
        city: "New York",
        deliveryMethod: "standard",
        paymentMethod: "card",
      });
      expect(result.success).toBe(true);
    });

    it("should reject short phone number", () => {
      const result = checkoutSchema.safeParse({
        name: "John",
        phone: "12345",
        address: "123 Main St",
        city: "New York",
        deliveryMethod: "standard",
        paymentMethod: "card",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("transferSchema", () => {
    it("should validate correct transfer data", () => {
      const result = transferSchema.safeParse({
        recipient: "user@test.com",
        amount: 100,
        pin: "1234",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero amount", () => {
      const result = transferSchema.safeParse({
        recipient: "user@test.com",
        amount: 0,
        pin: "1234",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative amount", () => {
      const result = transferSchema.safeParse({
        recipient: "user@test.com",
        amount: -50,
        pin: "1234",
      });
      expect(result.success).toBe(false);
    });

    it("should reject wrong pin length", () => {
      const result = transferSchema.safeParse({
        recipient: "user@test.com",
        amount: 100,
        pin: "12345",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("productSchema", () => {
    it("should validate correct product data", () => {
      const result = productSchema.safeParse({
        name: "Test Product",
        price: 29.99,
        stock: 10,
        category: "Electronics",
        description: "A great product",
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative stock", () => {
      const result = productSchema.safeParse({
        name: "Test",
        price: 10,
        stock: -1,
        category: "Test",
        description: "Test",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("shopSchema", () => {
    it("should validate correct shop data", () => {
      const result = shopSchema.safeParse({
        shopName: "My Shop",
        description: "Best shop ever",
        phone: "1234567890",
        address: "456 Shop Ave",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty shop name", () => {
      const result = shopSchema.safeParse({
        shopName: "",
        description: "Best shop ever",
        phone: "1234567890",
        address: "456 Shop Ave",
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional logo and banner", () => {
      const result = shopSchema.safeParse({
        shopName: "My Shop",
        description: "Best shop ever",
        phone: "1234567890",
        address: "456 Shop Ave",
        logo: "https://example.com/logo.png",
        banner: "https://example.com/banner.png",
      });
      expect(result.success).toBe(true);
    });
  });
});
