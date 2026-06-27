"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrder, useUpdateOrderStatus } from "../../../../lib/hooks/use-orders";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/Card";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { formatCurrency } from "../../../../lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../../components/ui/Table";

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { data: order, isLoading } = useOrder(id as string);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-[var(--color-text-muted)]">Loading order details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full items-center justify-center space-y-4">
          <p className="text-[var(--color-text-muted)]">Order not found.</p>
          <Button onClick={() => router.push("/orders")}>Back to Orders</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    updateStatus({ id: order.id, status: selectedStatus });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/orders")}>
              &larr; Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Order #{order.id.slice(0, 8)}
            </h1>
            <Badge 
              variant={
                order.status === "DELIVERED" ? "success" : 
                order.status === "PROCESSING" ? "info" : "error"
              }
            >
              {order.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              className="border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm bg-[var(--color-bg)]"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="" disabled>Select new status</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <Button 
              variant="primary" 
              disabled={isUpdating || !selectedStatus || selectedStatus === order.status}
              onClick={handleStatusUpdate}
            >
              Update Status
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Date</p>
                <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Total Amount</p>
                <p className="text-xl font-bold text-[var(--color-primary)]">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.user ? (
                <>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Name</p>
                    <p className="font-medium">{order.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Email</p>
                    <p className="font-medium">{order.user.email}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">Guest Order / No User Data</p>
              )}
            </CardContent>
          </Card>

          {/* Vendor Details */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.vendor ? (
                <>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Business Name</p>
                    <p className="font-medium">{order.vendor.businessName}</p>
                  </div>
                  <Button variant="ghost" className="p-0 h-auto text-[var(--color-primary)] hover:underline" onClick={() => router.push(`/vendors/${order.vendor.id}`)}>
                    View Vendor Profile &rarr;
                  </Button>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">No vendor associated.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product?.name || "Unknown Product"}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-[var(--color-text-muted)]">
                      No items found for this order.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
