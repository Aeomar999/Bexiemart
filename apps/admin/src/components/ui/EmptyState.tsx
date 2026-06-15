import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon = <FolderOpen className="h-10 w-10 text-[var(--color-text-muted)]" />, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface-100)] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
