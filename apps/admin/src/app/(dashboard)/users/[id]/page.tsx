"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useUpdateUserRole } from "../../../../lib/hooks/use-users";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/Card";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { formatCurrency } from "../../../../lib/utils";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { data: user, isLoading } = useUser(id as string);
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-[var(--color-text-muted)]">Loading user details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full items-center justify-center space-y-4">
          <p className="text-[var(--color-text-muted)]">User not found.</p>
          <Button onClick={() => router.push("/users")}>Back to Users</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/users")}>
              &larr; Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {user.firstName} {user.lastName}
            </h1>
            <Badge variant={user.role === "VENDOR" ? "info" : "default"}>{user.role}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            {user.role === "CUSTOMER" && (
              <Button 
                variant="outline" 
                disabled={isUpdatingRole}
                onClick={() => updateRole({ id: user.id, role: "VENDOR" })}
              >
                Promote to Vendor
              </Button>
            )}
            {user.role === "VENDOR" && (
              <Button 
                variant="outline" 
                disabled={isUpdatingRole}
                onClick={() => updateRole({ id: user.id, role: "CUSTOMER" })}
              >
                Demote to Customer
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Verification</p>
                <Badge variant={user.isVerified ? "success" : "warning"}>
                  {user.isVerified ? "VERIFIED" : "UNVERIFIED"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Joined At</p>
                <p className="font-medium">{new Date(user.createdAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Balance</p>
                <p className="text-2xl font-bold text-[var(--color-primary)]">
                  {formatCurrency(user.wallet?.balance || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Total Escrow (Locked)</p>
                <p className="font-medium text-[var(--color-text-secondary)]">
                  {formatCurrency(user.wallet?.lockedBalance || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Total Orders Made</p>
                <p className="text-xl font-medium">{user.orders?.length || 0}</p>
              </div>
              {user.vendorProfile && (
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">Vendor Profile</p>
                  <Button variant="ghost" className="p-0 h-auto text-[var(--color-primary)] hover:underline" onClick={() => router.push(`/vendors/${user.vendorProfile.id}`)}>
                    {user.vendorProfile.businessName} &rarr;
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
