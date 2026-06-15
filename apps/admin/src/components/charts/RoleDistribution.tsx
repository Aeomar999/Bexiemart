"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import { useUsersReport } from "../../lib/hooks/use-reports";

const COLORS = ["var(--color-primary)", "var(--color-secondary)", "var(--color-surface-400)", "#ffc658"];

export function RoleDistribution() {
  const { data: report, isLoading } = useUsersReport();

  const chartData = React.useMemo(() => {
    if (!report?.usersByRole || report.usersByRole.length === 0) return [];
    return report.usersByRole.map((item: any) => ({
      name: item.role,
      value: item.count
    }));
  }, [report]);

  if (isLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center text-[var(--color-text-muted)]">Loading chart data...</div>;
  }

  const data = chartData.length > 0 ? chartData : [{ name: "No Data", value: 1 }];
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry: { name: string; value: number }, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "var(--color-card)", 
              borderColor: "var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text)"
            }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
