import { colors, typography, spacing, radius } from "./index";

describe("theme barrel export", () => {
  it("should re-export all theme modules", () => {
    expect(colors).toBeDefined();
    expect(colors.brand).toBeDefined();
    expect(colors.surface).toBeDefined();
    expect(typography).toBeDefined();
    expect(typography.fontFamily).toBeDefined();
    expect(typography.fontSize).toBeDefined();
    expect(spacing).toBeDefined();
    expect(Object.keys(spacing).length).toBeGreaterThan(0);
    expect(radius).toBeDefined();
    expect(radius.sm).toBeDefined();
  });
});
