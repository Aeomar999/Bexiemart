import { colors } from "./colors";

describe("colors", () => {
  it("should have all color tokens defined", () => {
    expect(colors.brand[50]).toBeDefined();
    expect(colors.brand[500]).toBeDefined();
    expect(colors.brand[950]).toBeDefined();
    expect(colors.accent[50]).toBeDefined();
    expect(colors.accent[500]).toBeDefined();
    expect(colors.surface[50]).toBeDefined();
    expect(colors.surface[500]).toBeDefined();
    expect(colors.surface[950]).toBeDefined();
  });

  it("should have primary colors in valid hex format", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    expect(colors.brand[500]).toMatch(hexRegex);
    expect(colors.brand[50]).toMatch(hexRegex);
    expect(colors.accent[500]).toMatch(hexRegex);
    expect(colors.surface[500]).toMatch(hexRegex);
  });

  it("should have semantic colors defined", () => {
    expect(colors.success.DEFAULT).toBeDefined();
    expect(colors.success.light).toBeDefined();
    expect(colors.error.DEFAULT).toBeDefined();
    expect(colors.error.light).toBeDefined();
    expect(colors.warning.DEFAULT).toBeDefined();
    expect(colors.warning.light).toBeDefined();
  });

  it("should have matching key structure across brand, accent, surface", () => {
    const brandKeys = Object.keys(colors.brand).map(Number).filter(k => !isNaN(k));
    const accentKeys = Object.keys(colors.accent).map(Number).filter(k => !isNaN(k));
    const surfaceKeys = Object.keys(colors.surface).map(Number).filter(k => !isNaN(k));
    expect(brandKeys).toEqual(accentKeys);
    expect(brandKeys).toEqual(surfaceKeys);
  });
});
