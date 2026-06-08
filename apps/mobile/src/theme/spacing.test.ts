import { spacing, radius } from "./spacing";

describe("spacing", () => {
  it("should have spacing tokens forming a consistent scale", () => {
    const values = Object.values(spacing);
    expect(values[0]).toBe(0);
    expect(values[1]).toBe(4);
    expect(values).toEqual([0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 88, 120]);
  });

  it("should have border radius values defined", () => {
    expect(radius.sm).toBe(8);
    expect(radius.md).toBe(12);
    expect(radius.lg).toBe(16);
    expect(radius.xl).toBe(24);
    expect(radius["2xl"]).toBe(32);
    expect(radius.full).toBe(9999);
  });

  it("should have all spacing keys present", () => {
    const keys = Object.keys(spacing).map(Number);
    expect(keys).toContain(0);
    expect(keys).toContain(1);
    expect(keys).toContain(2);
    expect(keys).toContain(3);
    expect(keys).toContain(4);
    expect(keys).toContain(5);
    expect(keys).toContain(6);
    expect(keys).toContain(8);
    expect(keys).toContain(10);
    expect(keys).toContain(12);
    expect(keys).toContain(16);
    expect(keys).toContain(22);
    expect(keys).toContain(30);
  });
});
