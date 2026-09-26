import { formatMoney } from "./money";

describe("formatMoney (admin)", () => {
  it("matches the mobile format", () => {
    expect(formatMoney(1250)).toBe("GHS 1,250.00");
    expect(formatMoney(0.07)).toBe("GHS 0.07");
    expect(formatMoney(1000000)).toBe("GHS 1,000,000.00");
    expect(formatMoney(1250, "")).toBe("1,250.00");
    expect(formatMoney(-5)).toBe("GHS -5.00");
  });

  it("treats non-finite input as zero", () => {
    expect(formatMoney(Number.NaN)).toBe("GHS 0.00");
  });
});
