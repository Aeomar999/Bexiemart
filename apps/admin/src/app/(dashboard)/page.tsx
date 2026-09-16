"use client";

import dynamic from "next/dynamic";
import { HugeiconsIcon } from "@hugeicons/react";
import { UsersIcon, StoreIcon, ShoppingBagIcon, DollarSignIcon } from "@hugeicons/core-free-icons";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Stat } from "../../components/ui/Stat";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { useDashboardStats } from "../../lib/hooks/use-dashboard";
import { formatCurrency } from "../../lib/utils";

const RevenueChart = dynamic(
  () => import("../../components/charts/RevenueChart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded bg-[var(--color-surface-100)]" /> }
);
const RoleDistribution = dynamic(
  () => import("../../components/charts/RoleDistribution").then((m) => m.RoleDistribution),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded bg-[var(--color-surface-100)]" /> }
);
const OrdersTimeline = dynamic(
  () => import("../../components/charts/OrdersTimeline").then((m) => m.OrdersTimeline),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded bg-[var(--color-surface-100)]" /> }
);

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
            icon={<HugeiconsIcon icon={DollarSignIcon} className="h-6 w-6" />}
            trend={{ value: 12.5, isPositive: true }}
          />
          <Stat
            title="Active Vendors"
            value={displayStats.activeVendors}
            icon={<HugeiconsIcon icon={StoreIcon} className="h-6 w-6" />}
            trend={{ value: 4.3, isPositive: true }}
          />
          <Stat
            title="Total Orders"
            value={displayStats.totalOrders}
            icon={<HugeiconsIcon icon={ShoppingBagIcon} className="h-6 w-6" />}
            trend={{ value: 8.2, isPositive: true }}
          />
          <Stat
            title="Total Users"
            value={displayStats.totalUsers}
            icon={<HugeiconsIcon icon={UsersIcon} className="h-6 w-6" />}
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
