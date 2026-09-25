import { formatMoney } from "@/lib/money";

export const MASKED_MONEY = "GHS ••••";

export function displayMoney(amount: number, hidden: boolean): string {
  return hidden ? MASKED_MONEY : formatMoney(amount);
}

// One-line explanations shown by the ⓘ toggle on each role's held amount.
export const HELD_INFO = {
  customer:
    "Paid for orders that haven't been delivered yet. Released to the seller on delivery, or refunded here if cancelled.",
  vendor: "From orders still in escrow. Moves to Available when the buyer confirms delivery.",
  rider: "From deliveries awaiting customer confirmation.",
} as const;
