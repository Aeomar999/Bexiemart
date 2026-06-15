import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes, resolving conflicts using tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a given number as currency (GHS).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(amount);
}

/**
 * Delays execution for a specified number of milliseconds.
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
