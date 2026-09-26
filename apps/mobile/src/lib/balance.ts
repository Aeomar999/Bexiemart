import { formatMoney } from "@/lib/money";

export const MASKED_MONEY = "GHS ••••";

export function displayMoney(amount: number, hidden: boolean): string {
  return hidden ? MASKED_MONEY : formatMoney(amount);
}

// One-line explanations shown by the ⓘ toggle on each role's held amount.
export const HELD_INFO = {
  customer:
    "Money you've paid for orders that haven't been delivered yet. It's held in escrow, separate from your wallet balance.",
  vendor:
    "Payments for your orders that are held in escrow. They move to Available when the escrow is released.",
  rider: "From deliveries awaiting customer confirmation.",
} as const;
