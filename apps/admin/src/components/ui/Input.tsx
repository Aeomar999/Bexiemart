import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--color-error)] focus:ring-[var(--color-error)]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
