"use client";

import React, { useState } from "react";
import { useDeliveries } from "../../../lib/hooks/use-dispatchers";
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
import { Truck } from "lucide-react";
import { TableSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";

export default function DeliveriesPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: response, isLoading } = useDeliveries(page, limit);
  const deliveries = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Rides & Deliveries</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Delivery History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8">
                <TableSkeleton rows={5} columns={6} />
              </div>
            ) : deliveries.length === 0 ? (
              <EmptyState 
                icon={<Truck className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No deliveries found"
                description="There are currently no active deliveries or rides on the platform."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Dropoff</TableHead>
                    <TableHead>Dispatcher</TableHead>
                    <TableHead>Fee / Payout</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery: any) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{delivery.customer?.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{delivery.customer?.phoneNumber || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{delivery.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={delivery.pickupAddress}>{delivery.pickupAddress}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={delivery.dropoffAddress}>{delivery.dropoffAddress}</TableCell>
                      <TableCell>
                        {delivery.dispatcher ? (
                          <div className="flex flex-col">
                            <span>{delivery.dispatcher.user?.name}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{delivery.dispatcher.plateNumber}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--color-text-muted)] italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>GH₵ {delivery.customerFee}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            payout {delivery.driverPayout}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            delivery.status === "DELIVERED" ? "success" :
                            delivery.status === "PENDING" ? "default" :
                            delivery.status === "CANCELLED" ? "error" : "warning"
                          }
                        >
                          {delivery.status}
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
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} deliveries
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
