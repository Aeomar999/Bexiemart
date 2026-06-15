"use client";

import React, { useState } from "react";
import { useFoodOrders } from "../../../lib/hooks/use-food";
import { Pagination } from "../../../components/ui/Pagination";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Pizza } from "lucide-react";
import { TableSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";

export default function FoodOrdersPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: response, isLoading } = useFoodOrders(page, limit);
  const orders = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Food Orders</h1>

        <Card>
          <CardHeader>
            <CardTitle>Active & Past Food Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8"><TableSkeleton rows={5} columns={5} /></div>
            ) : orders.length === 0 ? (
              <EmptyState 
                icon={<Pizza className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No food orders found"
                description="There are currently no food orders on the platform."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{order.user?.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{order.user?.phoneNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.vendor?.shopName}</TableCell>
                      <TableCell>GH₵ {order.total}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            order.status === "DELIVERED" ? "success" : 
                            order.status === "CANCELLED" ? "error" : "warning"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
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
