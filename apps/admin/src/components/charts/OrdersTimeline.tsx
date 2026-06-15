"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { useOrdersReport } from "../../lib/hooks/use-reports";

export function OrdersTimeline() {
  const { data: report, isLoading } = useOrdersReport();

  const chartData = React.useMemo(() => {
    if (!report?.data || report.data.length === 0) return [];
    
    const grouped = report.data.reduce((acc: any, item: any) => {
      const date = new Date(item.createdAt);
      const day = date.toLocaleString('default', { weekday: 'short' });
      
      if (!acc[day]) acc[day] = 0;
      acc[day] += 1;
      return acc;
    }, {});
    
    return Object.keys(grouped).map(day => ({
      name: day,
      orders: grouped[day]
    }));
  }, [report]);

  if (isLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center text-[var(--color-text-muted)]">Loading chart data...</div>;
  }

  const data = chartData.length > 0 ? chartData : [{ name: "No Data", orders: 0 }];
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
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
          />
          <Tooltip 
            cursor={{ fill: "var(--color-surface-100)" }}
            contentStyle={{ 
              backgroundColor: "var(--color-card)", 
              borderColor: "var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text)"
            }}
          />
          <Bar dataKey="orders" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
