"use client";

import React, { useState } from "react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { apiClient } from "../../../lib/api/client";
import { exportToCsv } from "../../../lib/utils/export";
import { toast } from "sonner";

export default function ReportsPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const generateReport = async (type: string, endpoint: string, filename: string) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      const { data } = await apiClient.get(endpoint);
      
      // The API wraps responses in { data: [...], meta: {...} }
      const items = Array.isArray(data.data) ? data.data : data;
      
      if (!items || items.length === 0) {
        toast.info(`No data available for ${filename}`);
        return;
      }
      
      exportToCsv(items, filename);
      toast.success(`${filename} exported successfully`);
    } catch (error) {
      console.error(`Failed to generate report for ${type}:`, error);
      toast.error(`Failed to generate ${type} report`);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Reports</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Sales Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Export detailed sales data by day, week, or month.</p>
              <Button 
                variant="outline" 
                className="w-full"
                isLoading={loading.sales}
                disabled={loading.sales}
                onClick={() => generateReport('sales', '/admin/orders?limit=1000', 'sales-report')}
              >
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Analyze top-performing vendors and their metrics.</p>
              <Button 
                variant="outline" 
                className="w-full"
                isLoading={loading.vendors}
                disabled={loading.vendors}
                onClick={() => generateReport('vendors', '/admin/vendors?limit=1000', 'vendor-performance')}
              >
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dispute Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Export historical data on disputes and resolutions.</p>
              <Button 
                variant="outline" 
                className="w-full"
                isLoading={loading.disputes}
                disabled={loading.disputes}
                onClick={() => generateReport('disputes', '/admin/disputes?limit=1000', 'dispute-summary')}
              >
                Generate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
