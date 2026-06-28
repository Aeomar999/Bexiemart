"use client";

import React, { useState } from "react";
import { useFoodVendors } from "../../../lib/hooks/use-food";
import { Pagination } from "../../../components/ui/Pagination";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Store } from "lucide-react";
import { TableSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";

export default function FoodVendorsPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: response, isLoading } = useFoodVendors(page, limit);
  const vendors = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Restaurants Directory</h1>

        <Card>
          <CardHeader>
            <CardTitle>Registered Restaurants & Food Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8"><TableSkeleton rows={5} columns={4} /></div>
            ) : vendors.length === 0 ? (
              <EmptyState 
                icon={<Store className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No restaurants found"
                description="No vendors have added food items yet."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Menu Items</TableHead>
                    <TableHead>Total Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor: any) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.shopName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{vendor.user?.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{vendor.user?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{vendor._count?.foodItems || 0}</TableCell>
                      <TableCell>{vendor._count?.foodOrders || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          
            {!isLoading && (
              <Pagination
                page={page}
                totalPages={response?.meta?.totalPages || 1}
                total={response?.meta?.total || 0}
                onPageChange={setPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
