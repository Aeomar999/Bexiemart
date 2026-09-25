import { displayMoney, MASKED_MONEY, HELD_INFO } from "./balance";

describe("balance helpers", () => {
  it("formats visible amounts with formatMoney", () => {
    expect(displayMoney(12480.5, false)).toBe("GHS 12,480.50");
    expect(displayMoney(0, false)).toBe("GHS 0.00");
  });

  it("masks hidden amounts", () => {
    expect(MASKED_MONEY).toBe("GHS ••••");
    expect(displayMoney(12480.5, true)).toBe("GHS ••••");
  });

  it("has explanation copy for every role", () => {
    expect(Object.keys(HELD_INFO).sort()).toEqual(["customer", "rider", "vendor"]);
    expect(HELD_INFO.rider).toBe("From deliveries awaiting customer confirmation.");
  });
});
