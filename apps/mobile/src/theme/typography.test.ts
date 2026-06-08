import { typography } from "./typography";

describe("typography", () => {
  it("should have font families defined", () => {
    expect(typography.fontFamily.heading).toBe("Raleway");
    expect(typography.fontFamily.body).toBe("Nunito");
  });

  it("should have font sizes in expected descending scale", () => {
    const sizes = Object.values(typography.fontSize);
    expect(sizes[0]).toBeGreaterThan(sizes[sizes.length - 1]);
    expect(typography.fontSize.displayLg).toBe(32);
    expect(typography.fontSize.caption).toBe(11);
  });

  it("should have font weights matching expected values", () => {
    expect(typography.fontWeight.light).toBe("300");
    expect(typography.fontWeight.regular).toBe("400");
    expect(typography.fontWeight.medium).toBe("500");
    expect(typography.fontWeight.semibold).toBe("600");
    expect(typography.fontWeight.bold).toBe("700");
  });
});
