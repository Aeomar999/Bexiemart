"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatcher, useUpdateDispatcherStatus } from "../../../../lib/hooks/use-dispatchers";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { Badge } from "../../../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { toast } from "sonner";
import { ArrowLeft, User, Bike, MapPin, Navigation } from "lucide-react";

export default function DispatcherDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: dispatcher, isLoading } = useDispatcher(id);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateDispatcherStatus();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[var(--color-primary)]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dispatcher) {
    return (
      <DashboardLayout>
        <div className="flex h-64 flex-col items-center justify-center space-y-4">
          <p className="text-lg font-medium text-[var(--color-text-muted)]">Dispatcher not found</p>
          <Button variant="outline" onClick={() => router.push("/dispatchers")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dispatchers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    updateStatus(
      { id, status: newStatus },
      {
        onSuccess: () => toast.success(`Dispatcher status updated to ${newStatus}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dispatchers")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Dispatcher Details
          </h1>
          <Badge 
            variant={
              dispatcher.status === "ONLINE" ? "success" : 
              dispatcher.status === "OFFLINE" ? "default" : "warning"
            }
          >
            {dispatcher.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                Driver Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center pb-4">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--color-primary)]/20 bg-gray-100 flex items-center justify-center">
                  {dispatcher.user?.image ? (
                    <img src={dispatcher.user.image} alt={dispatcher.user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-gray-400">{dispatcher.user?.name?.charAt(0)}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Name</p>
                <p className="font-medium">{dispatcher.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Email</p>
                <p className="font-medium">{dispatcher.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Phone</p>
                <p className="font-medium">{dispatcher.user?.phoneNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Registered</p>
                <p className="font-medium">{new Date(dispatcher.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <p className="text-sm font-medium mb-3">Admin Actions</p>
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="primary" 
                    className="w-full"
                    disabled={isUpdating || dispatcher.status === "ONLINE"}
                    onClick={() => handleStatusChange("ONLINE")}
                  >
                    Set Online (Approve)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-[var(--color-error)] border-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                    disabled={isUpdating || dispatcher.status === "SUSPENDED"}
                    onClick={() => handleStatusChange("SUSPENDED")}
                  >
                    Suspend Dispatcher
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle & Stats */}
          <div className="flex flex-col space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bike className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                  Vehicle & Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-50)]">
                    <p className="text-sm text-[var(--color-text-muted)]">Vehicle Type</p>
                    <p className="text-lg font-bold capitalize">{dispatcher.vehicleType}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-50)]">
                    <p className="text-sm text-[var(--color-text-muted)]">Plate Number</p>
                    <p className="text-lg font-bold">{dispatcher.plateNumber}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-50)]">
                    <p className="text-sm text-[var(--color-text-muted)]">Total Earnings</p>
                    <p className="text-lg font-bold text-[var(--color-success)]">GH₵ {dispatcher.totalEarnings}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-50)]">
                    <p className="text-sm text-[var(--color-text-muted)]">Pending Payout</p>
                    <p className="text-lg font-bold text-[var(--color-warning)]">GH₵ {dispatcher.pendingPayout}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Navigation className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                  Trip Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[var(--color-border)] p-4 flex flex-col items-center justify-center">
                    <p className="text-sm text-[var(--color-text-muted)]">Rides Completed</p>
                    <p className="text-3xl font-bold mt-2">{dispatcher.stats?.totalRides || 0}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] p-4 flex flex-col items-center justify-center">
                    <p className="text-sm text-[var(--color-text-muted)]">Deliveries Completed</p>
                    <p className="text-3xl font-bold mt-2">{dispatcher.stats?.totalDeliveries || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                  Last Known Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dispatcher.lastLatitude && dispatcher.lastLongitude ? (
                  <div className="flex flex-col space-y-2">
                    <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
                      <p className="text-gray-500">Map integration pending: {dispatcher.lastLatitude}, {dispatcher.lastLongitude}</p>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] text-right">
                      Last updated: {dispatcher.lastLocationAt ? new Date(dispatcher.lastLocationAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                ) : (
                  <p className="text-[var(--color-text-muted)] italic">No location data recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
