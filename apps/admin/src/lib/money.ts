// Mirror of apps/mobile/src/lib/money.ts#formatMoney so both apps print money
// identically: "GHS 1,250.00". Integer pesewas internally to avoid float drift.
const MINOR = 100;

export function formatMoney(major: number, currency = "GHS"): string {
  const minor = Number.isFinite(major) ? Math.round(major * MINOR) : 0;
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / MINOR);
  const cents = abs % MINOR;
  const body = `${neg ? "-" : ""}${whole.toLocaleString("en-US")}.${String(cents).padStart(2, "0")}`;
  return currency ? `${currency} ${body}` : body;
}
