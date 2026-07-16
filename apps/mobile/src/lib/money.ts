const MINOR = 100;

export function toMinor(input: string | number): number {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return 0;
    return Math.round(input * MINOR);
  }
  const s = input.trim();
  if (!s || s === "." || s === "-") return 0;
  const neg = s.startsWith("-");
  const cleaned = s.replace(/[^0-9.]/g, "");
  const [intPart = "0", decPart = ""] = cleaned.split(".");
  const cents = (decPart + "00").slice(0, 2);
  const minor = (parseInt(intPart || "0", 10) || 0) * MINOR + (parseInt(cents, 10) || 0);
  return neg ? -minor : minor;
}

export function toMajor(minor: number): number {
  return Math.round(minor) / MINOR;
}

export function formatMoney(major: number, currency = "GHS"): string {
  const minor = toMinor(major);
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / MINOR);
  const cents = abs % MINOR;
  const body = `${neg ? "-" : ""}${whole.toLocaleString("en-US")}.${String(cents).padStart(2, "0")}`;
  return currency ? `${currency} ${body}` : body;
}

export function sanitizeInput(raw: string): string {
  let s = raw.replace(/[^0-9.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
    const [intPart, decPart = ""] = s.split(".");
    s = intPart + "." + decPart.slice(0, 2);
  }
  if (s.length > 1 && s[0] === "0" && s[1] !== ".") {
    s = s.replace(/^0+/, "");
    if (s === "" || s[0] === ".") s = "0" + s;
  }
  return s;
}

export function clampMoney(major: number, min?: number, max?: number): number {
  let v = major;
  if (typeof min === "number" && v < min) v = min;
  if (typeof max === "number" && v > max) v = max;
  return v;
}

export function toEditString(major: number): string {
  if (!major) return "";
  const minor = toMinor(major);
  const neg = minor < 0;
  const abs = Math.abs(minor);
  return `${neg ? "-" : ""}${Math.floor(abs / MINOR)}.${String(abs % MINOR).padStart(2, "0")}`;
}
