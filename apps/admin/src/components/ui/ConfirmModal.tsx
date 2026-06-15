import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-xl bg-[var(--color-bg)] p-6 shadow-xl border border-[var(--color-border)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              variant === "danger" ? "bg-red-100 text-red-600" : 
              variant === "warning" ? "bg-orange-100 text-orange-600" :
              "bg-blue-100 text-blue-600"
            )}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-100)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          {description}
        </p>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === "danger" ? "danger" : "primary"} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
