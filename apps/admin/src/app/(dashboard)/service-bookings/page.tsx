"use client";

import React, { useState } from "react";
import { useServiceBookings } from "../../../lib/hooks/use-services";
import { Pagination } from "../../../components/ui/Pagination";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Wrench } from "lucide-react";
import { TableSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";

export default function ServiceBookingsPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: response, isLoading } = useServiceBookings(page, limit);
  const bookings = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Service Bookings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Platform Service Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8"><TableSkeleton rows={5} columns={5} /></div>
            ) : bookings.length === 0 ? (
              <EmptyState 
                icon={<Wrench className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No service bookings found"
                description="There are currently no service appointments booked."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{booking.user?.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{booking.user?.phoneNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>{booking.service?.name}</TableCell>
                      <TableCell>{booking.service?.vendor?.shopName || "Platform"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            booking.status === "COMPLETED" ? "success" : 
                            booking.status === "CANCELLED" ? "error" : "warning"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(booking.createdAt).toLocaleDateString()}</TableCell>
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
