import React from "react";
import { Card, CardContent } from "./Card";
import { cn } from "../../lib/utils";

interface StatProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function Stat({ title, value, icon, trend, className }: StatProps) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-(--color-text-muted)">{title}</span>
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--color-primary-subtle) text-(--color-primary) shadow-sm">
              {React.isValidElement(icon) 
                ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5" }) 
                : icon}
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-1">
          <span className="text-2xl font-bold text-(--color-text) tracking-tight truncate">{value}</span>
          
          {trend && (
            <div className="flex items-center pt-1">
              <span
                className={cn(
                  "inline-flex items-center font-semibold text-xs",
                  trend.isPositive ? "text-(--color-success)" : "text-(--color-error)"
                )}
              >
                {trend.isPositive ? "+" : "-"}{trend.value}%
              </span>
              <span className="ml-1.5 text-xs text-(--color-text-muted) truncate">vs last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
