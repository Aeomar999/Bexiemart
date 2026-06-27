"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVendor, useApproveVendor, useSuspendVendor } from "../../../../lib/hooks/use-vendors";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/Card";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";
import { CardSkeleton } from "../../../../components/ui/Skeleton";

export default function VendorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  const { data: vendor, isLoading } = useVendor(id as string);
  const { mutate: approve, isPending: isApproving } = useApproveVendor();
  const { mutate: suspend, isPending: isSuspending } = useSuspendVendor();

  const handleSuspend = () => {
    suspend(vendor.id, {
      onSuccess: () => setIsSuspendModalOpen(false)
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" disabled>&larr; Back</Button>
            <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface-200)]"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!vendor) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full items-center justify-center space-y-4">
          <p className="text-[var(--color-text-muted)]">Vendor not found.</p>
          <Button onClick={() => router.push("/vendors")}>Back to Vendors</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/vendors")}>
              &larr; Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {vendor.businessName}
            </h1>
            <Badge 
              variant={
                vendor.verificationStatus === "APPROVED" ? "success" : 
                vendor.verificationStatus === "PENDING" ? "warning" : "error"
              }
            >
              {vendor.verificationStatus}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {vendor.verificationStatus !== "APPROVED" && (
              <Button 
                variant="primary" 
                disabled={isApproving}
                onClick={() => approve(vendor.id)}
              >
                Approve Vendor
              </Button>
            )}
            {vendor.verificationStatus !== "SUSPENDED" && (
              <Button 
                variant="danger" 
                disabled={isSuspending}
                onClick={() => setIsSuspendModalOpen(true)}
              >
                Suspend Vendor
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Description</p>
                <p className="font-medium">{vendor.description || "No description provided."}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Location</p>
                <p className="font-medium text-[var(--color-text-secondary)]">
                  Lat: {vendor.latitude || "N/A"}, Lng: {vendor.longitude || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Registered At</p>
                <p className="font-medium">{new Date(vendor.createdAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Owner Details */}
          <Card>
            <CardHeader>
              <CardTitle>Owner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.user ? (
                <>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Name</p>
                    <p className="font-medium">{vendor.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Email</p>
                    <p className="font-medium">{vendor.user.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/users/${vendor.user.id}`)}>
                    View User Profile &rarr;
                  </Button>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">No associated user found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        onConfirm={handleSuspend}
        title="Suspend Vendor"
        description={`Are you sure you want to suspend ${vendor.businessName}? This action will prevent them from making any new sales.`}
        confirmText="Yes, Suspend"
        isLoading={isSuspending}
      />
    </DashboardLayout>
  );
}
