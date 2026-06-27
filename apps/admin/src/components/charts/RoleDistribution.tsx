"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useUsersReport } from "../../lib/hooks/use-reports";
import { Skeleton } from "../ui/Skeleton";

// Theme-compliant colors for different user roles
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "var(--color-warning)",
  VENDOR: "var(--color-secondary)",
  CUSTOMER: "var(--color-primary)",
  DEFAULT: "var(--color-border)"
};

export function RoleDistribution() {
  const { data: report, isLoading } = useUsersReport();

  const chartData = useMemo(() => {
    if (!report?.usersByRole || report.usersByRole.length === 0) return [];
    
    // Calculate total for percentages
    const total = report.usersByRole.reduce((sum: number, item: any) => sum + item.count, 0);
    
    return report.usersByRole.map((item: any) => ({
      name: item.role.charAt(0).toUpperCase() + item.role.slice(1).toLowerCase(),
      originalRole: item.role,
      value: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    })).sort((a: any, b: any) => b.value - a.value);
  }, [report]);

  const totalUsers = useMemo(() => {
    return chartData.reduce((sum: number, item: any) => sum + item.value, 0);
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex h-[320px] w-full flex-col items-center justify-center space-y-4">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[320px] w-full flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-(--color-bg-hover) p-4">
          <div className="h-16 w-16 rounded-full border-4 border-dashed border-(--color-border)" />
        </div>
        <p className="text-sm font-medium text-(--color-text)">No demographic data</p>
        <p className="text-xs text-(--color-text-muted)">User roles will appear here once registered.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[350px] w-full">
      {/* Chart Area */}
      <div className="relative flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={4}
              cornerRadius={8}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={ROLE_COLORS[entry.originalRole] || ROLE_COLORS.DEFAULT} 
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Central Total Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-black text-(--color-text) tracking-tighter">{totalUsers}</span>
          <span className="text-[10px] font-bold text-(--color-text-muted) uppercase tracking-[0.2em] mt-1">Total Users</span>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-4 px-2 pb-2">
        {chartData.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center space-x-3">
            <div 
              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm" 
              style={{ backgroundColor: ROLE_COLORS[entry.originalRole] || ROLE_COLORS.DEFAULT }}
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-(--color-text-muted) uppercase tracking-wider">{entry.name}</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-base font-bold text-(--color-text) leading-none">{entry.value}</span>
                <span className="text-xs font-medium text-(--color-text-muted)">({entry.percentage}%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-(--color-border) bg-(--color-card) p-3 shadow-xl flex items-center space-x-3 min-w-[140px]">
        <div 
          className="h-3 w-3 rounded-full shrink-0" 
          style={{ backgroundColor: ROLE_COLORS[data.originalRole] || ROLE_COLORS.DEFAULT }}
        />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-(--color-text-muted) uppercase tracking-wider">{data.name}</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-bold text-(--color-text)">{data.value}</span>
            <span className="text-xs font-medium text-(--color-text-muted)">users</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
