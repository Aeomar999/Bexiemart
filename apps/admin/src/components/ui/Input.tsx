import React, { useState, KeyboardEvent } from "react";
import { cn } from "../../lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon, Alert01Icon } from "@hugeicons/core-free-icons";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, onKeyDown, onKeyUp, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);

    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    const checkCapsLock = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.getModifierState && typeof e.getModifierState === "function") {
        setCapsLockOn(e.getModifierState("CapsLock"));
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (isPassword) checkCapsLock(e);
      if (onKeyDown) onKeyDown(e);
    };

    const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
      if (isPassword) checkCapsLock(e);
      if (onKeyUp) onKeyUp(e);
    };

    return (
      <div className="w-full relative">
        <div className="relative">
          <input
            ref={ref}
            type={currentType}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            className={cn(
              "flex h-10 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-[var(--color-error)] focus:ring-[var(--color-error)]",
              isPassword && "pr-10",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={18} />
            </button>
          )}
        </div>
        
        {isPassword && capsLockOn && (
          <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-warning)] text-yellow-600">
            <HugeiconsIcon icon={Alert01Icon} size={14} />
            <span>Caps Lock is ON</span>
          </div>
        )}
        
        {error && <p className="mt-1 text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
