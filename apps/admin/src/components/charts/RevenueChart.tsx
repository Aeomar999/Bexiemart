"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../../lib/utils";

import { useRevenueReport } from "../../lib/hooks/use-reports";

export function RevenueChart() {
  const { data: report, isLoading } = useRevenueReport();

  const chartData = React.useMemo(() => {
    if (!report?.data || report.data.length === 0) return [];
    
    const grouped = report.data.reduce((acc: any, item: any) => {
      const date = new Date(item.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!acc[month]) acc[month] = 0;
      acc[month] += Number(item.commission || 0);
      return acc;
    }, {});
    
    return Object.keys(grouped).map(month => ({
      name: month,
      revenue: grouped[month]
    }));
  }, [report]);

  if (isLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center text-[var(--color-text-muted)]">Loading chart data...</div>;
  }

  const data = chartData.length > 0 ? chartData : [{ name: "No Data", revenue: 0 }];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            tickFormatter={(value) => `GHS ${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "var(--color-card)", 
              borderColor: "var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text)"
            }}
            formatter={(value: number) => [formatCurrency(value), "Revenue"]}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="var(--color-primary)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
