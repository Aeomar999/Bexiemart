import {
  getTransactionIcon,
  getCardColors,
  getTransactionColors,
  getAmountPrefix,
  isPositiveTransaction,
} from "./wallet";

describe("Wallet Utils", () => {
  describe("getTransactionIcon", () => {
    it("returns correct icon for DEPOSIT", () => {
      expect(getTransactionIcon("DEPOSIT")).toBe("arrow-down-left");
    });
    it("returns default icon for unknown type", () => {
      expect(getTransactionIcon("UNKNOWN")).toBe("file-text");
    });
  });

  describe("getCardColors", () => {
    it("returns consistent colors based on ID", () => {
      const colors1 = getCardColors("test-id-1");
      const colors2 = getCardColors("test-id-1");
      expect(colors1).toEqual(colors2);
    });

    it("returns different colors for different IDs", () => {
      const colors1 = getCardColors("test-id-1");
      const colors2 = getCardColors("test-id-2");
      expect(colors1).not.toEqual(colors2);
    });

    it("falls back based on card type if no ID is provided", () => {
      const visaColors = getCardColors(undefined, "Visa");
      expect(visaColors[0]).toBe("#1a202c"); // Midnight Navy start
    });
  });

  describe("getTransactionColors", () => {
    it("returns positive styling for DEPOSIT", () => {
      const colors = getTransactionColors("DEPOSIT");
      expect(colors.text).toBe("text-emerald-600");
    });

    it("returns negative styling for WITHDRAWAL", () => {
      const colors = getTransactionColors("WITHDRAWAL");
      expect(colors.text).toBe("text-rose-600");
    });
  });

  describe("getAmountPrefix", () => {
    it("returns + for DEPOSIT", () => {
      expect(getAmountPrefix("DEPOSIT")).toBe("+");
    });
    it("returns - for WITHDRAWAL", () => {
      expect(getAmountPrefix("WITHDRAWAL")).toBe("-");
    });
  });

  describe("isPositiveTransaction", () => {
    it("returns true for DEPOSIT", () => {
      expect(isPositiveTransaction("DEPOSIT")).toBe(true);
    });
    it("returns false for WITHDRAWAL", () => {
      expect(isPositiveTransaction("WITHDRAWAL")).toBe(false);
    });
  });
});
