import { toMinor, toMajor, formatMoney, sanitizeInput, clampMoney, toEditString } from "./money";

describe("money", () => {
  describe("toMinor", () => {
    it("parses a decimal string to integer pesewas", () => {
      expect(toMinor("12.50")).toBe(1250);
      expect(toMinor("12.5")).toBe(1250);
      expect(toMinor("0.07")).toBe(7);
      expect(toMinor("100")).toBe(10000);
    });
    it("parses a number without float drift", () => {
      expect(toMinor(0.1 + 0.2)).toBe(30);
      expect(toMinor(7 * 1.1)).toBe(770);
    });
    it("ignores a third decimal", () => {
      expect(toMinor("1.239")).toBe(123);
    });
    it("returns 0 for empty or junk", () => {
      expect(toMinor("")).toBe(0);
      expect(toMinor(".")).toBe(0);
      expect(toMinor("abc")).toBe(0);
    });
  });

  describe("toMajor", () => {
    it("converts pesewas back to a major number", () => {
      expect(toMajor(1250)).toBe(12.5);
      expect(toMajor(7)).toBe(0.07);
    });
  });

  describe("formatMoney", () => {
    it("groups thousands and always shows 2dp", () => {
      expect(formatMoney(1250)).toBe("GHS 1,250.00");
      expect(formatMoney(0.07)).toBe("GHS 0.07");
      expect(formatMoney(1000000)).toBe("GHS 1,000,000.00");
    });
    it("omits the prefix when currency is empty", () => {
      expect(formatMoney(1250, "")).toBe("1,250.00");
    });
    it("honors a custom currency", () => {
      expect(formatMoney(5, "USD")).toBe("USD 5.00");
    });
  });

  describe("sanitizeInput", () => {
    it("strips non-numeric characters", () => {
      expect(sanitizeInput("1a2b3")).toBe("123");
    });
    it("keeps only the first dot and 2 decimals", () => {
      expect(sanitizeInput("1.2.3")).toBe("1.23");
      expect(sanitizeInput("1.239")).toBe("1.23");
    });
    it("strips leading zeros but preserves 0.x", () => {
      expect(sanitizeInput("007")).toBe("7");
      expect(sanitizeInput("0.5")).toBe("0.5");
    });
  });

  describe("clampMoney", () => {
    it("bounds to min and max", () => {
      expect(clampMoney(3, 5, 100)).toBe(5);
      expect(clampMoney(150, 5, 100)).toBe(100);
      expect(clampMoney(50, 5, 100)).toBe(50);
    });
  });

  describe("toEditString", () => {
    it("formats a value for the edit buffer without grouping", () => {
      expect(toEditString(1250)).toBe("1250.00");
      expect(toEditString(12.5)).toBe("12.50");
    });
    it("returns empty string for zero/falsy", () => {
      expect(toEditString(0)).toBe("");
    });
  });
});
