import { darkTokens } from "../tokens";

/** WCAG relative luminance of an #rrggbb color. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const linear = channels.map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** WCAG contrast ratio between two colors (1–21). */
function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe("dark palette contrast (WCAG)", () => {
  it("primary text meets AA (>=4.5) on background and surface", () => {
    expect(contrast(darkTokens.textPrimary, darkTokens.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkTokens.textPrimary, darkTokens.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("secondary text meets AA (>=4.5) on surface", () => {
    expect(contrast(darkTokens.textSecondary, darkTokens.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("muted text and primary UI meet the 3:1 large/UI threshold on surface", () => {
    expect(contrast(darkTokens.textMuted, darkTokens.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(darkTokens.primary, darkTokens.surface)).toBeGreaterThanOrEqual(3);
  });
});
