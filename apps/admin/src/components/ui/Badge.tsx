import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[var(--color-surface-200)] text-[var(--color-text-secondary)]",
    success: "bg-[#00D084]/10 text-[#00D084]",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B]",
    error: "bg-[#EF4444]/10 text-[#EF4444]",
    info: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
