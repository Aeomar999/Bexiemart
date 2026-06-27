"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrders } from "../../../lib/hooks/use-orders";
import { useDebounce } from "../../../lib/hooks/use-debounce";
import { Pagination } from "../../../components/ui/Pagination";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../components/ui/Table";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Search, ShoppingBag } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { TableSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";

export default function OrdersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Real data
  const { data: response, isLoading } = useOrders({ page, limit, search: debouncedSearch });
  const orders = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Orders</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 pb-4">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                <Input
                  placeholder="Search orders (ID, customer)..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="py-8">
                <TableSkeleton rows={5} columns={6} />
              </div>
            ) : orders.length === 0 ? (
              <EmptyState 
                icon={<ShoppingBag className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No orders found"
                description={debouncedSearch ? "We couldn't find any orders matching your search." : "No orders have been placed yet."}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-[var(--color-bg)]" onClick={() => router.push(`/orders/${order.id}`)}>
                      <TableCell className="font-medium text-[var(--color-primary)]">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{order.user?.name}</TableCell>
                      <TableCell>{order.vendor?.businessName || "N/A"}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            order.status === "DELIVERED" ? "success" : 
                            order.status === "PROCESSING" ? "info" : "error"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-[var(--color-text-muted)]">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} orders
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    className="px-3 py-1 border border-[var(--color-border)] rounded-md disabled:opacity-50"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span className="text-sm">Page {page} of {totalPages}</span>
                  <button
                    className="px-3 py-1 border border-[var(--color-border)] rounded-md disabled:opacity-50"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
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
