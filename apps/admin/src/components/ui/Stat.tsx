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
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-[var(--color-text-muted)]">{title}</span>
            <span className="text-2xl font-bold text-[var(--color-text)]">{value}</span>
            {trend && (
              <div className="flex items-center pt-1 text-sm">
                <span
                  className={cn(
                    "font-medium",
                    trend.isPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                  )}
                >
                  {trend.isPositive ? "+" : "-"}{trend.value}%
                </span>
                <span className="ml-2 text-[var(--color-text-muted)]">from last month</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
