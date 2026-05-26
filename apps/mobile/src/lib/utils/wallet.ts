import type { Transaction, TransactionType } from "@/lib/stores/wallet-store";

export function getTransactionIcon(type: TransactionType | string): string {
  switch (type) {
    case "DEPOSIT": return "arrow-down-left";
    case "WITHDRAWAL": return "arrow-up-right";
    case "ORDER_PAYMENT": return "shopping-bag";
    case "TRANSFER_RECEIVED": return "arrow-down-left";
    case "FEE": return "info";
    default: return "file-text";
  }
}

export function getTransactionColors(type: TransactionType | string) {
  switch (type) {
    case "DEPOSIT": case "TRANSFER_RECEIVED":
      return { bg: "#d1fae5", icon: "#059669", text: "text-emerald-600" };
    case "WITHDRAWAL": case "FEE":
      return { bg: "#fee2e2", icon: "#dc2626", text: "text-rose-600" };
    default:
      return { bg: "#f1f5f9", icon: "#64748b", text: "text-muted-foreground" };
  }
}

export function getAmountPrefix(type: TransactionType | string): string {
  switch (type) {
    case "DEPOSIT": case "TRANSFER_RECEIVED": return "+";
    default: return "-";
  }
}

export function isPositiveTransaction(type: TransactionType | string): boolean {
  return type === "DEPOSIT" || type === "TRANSFER_RECEIVED";
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
