"use client";

import React from "react";
import { Users, Store, ShoppingBag, DollarSign } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Stat } from "../../components/ui/Stat";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { RevenueChart } from "../../components/charts/RevenueChart";
import { RoleDistribution } from "../../components/charts/RoleDistribution";
import { OrdersTimeline } from "../../components/charts/OrdersTimeline";
import { useDashboardStats } from "../../lib/hooks/use-dashboard";
import { formatCurrency } from "../../lib/utils";

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-[var(--color-text-muted)]">Here&apos;s an overview of your platform today.</p>
        </div>
      </DashboardLayout>
    );
  }

  const displayStats = stats || { totalUsers: 0, activeVendors: 0, totalOrders: 0, totalRevenue: 0 };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Dashboard Overview</h1>
          <p className="text-[var(--color-text-muted)]">Welcome back, Admin! Here is what&apos;s happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Stat
            title="Total Revenue"
            value={formatCurrency(displayStats.totalRevenue)}
            icon={<DollarSign className="h-6 w-6" />}
            trend={{ value: 12.5, isPositive: true }}
          />
          <Stat
            title="Active Vendors"
            value={displayStats.activeVendors}
            icon={<Store className="h-6 w-6" />}
            trend={{ value: 4.3, isPositive: true }}
          />
          <Stat
            title="Total Orders"
            value={displayStats.totalOrders}
            icon={<ShoppingBag className="h-6 w-6" />}
            trend={{ value: 8.2, isPositive: true }}
          />
          <Stat
            title="Total Users"
            value={displayStats.totalUsers}
            icon={<Users className="h-6 w-6" />}
            trend={{ value: 2.1, isPositive: true }}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <RevenueChart />
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>User Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleDistribution />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Orders Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersTimeline />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
