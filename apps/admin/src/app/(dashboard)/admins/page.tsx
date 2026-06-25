"use client";

import React, { useState } from "react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { useUser } from "../../../lib/hooks/use-auth";
import { useAdmins, useCreateAdmin } from "../../../lib/hooks/use-admins";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/Table";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { TableSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ShieldCheck, Plus, Lock } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = { name: "", email: "", password: "" };

export default function AdminsPage() {
  const { data: me, isLoading: meLoading } = useUser();
  const isSuperAdmin = !!me?.isSuperAdmin;

  const { data: admins, isLoading } = useAdmins();
  const { mutate: createAdmin, isPending } = useCreateAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    createAdmin(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
        toast.success("Admin account created");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to create admin");
      },
    });
  };

  // Gate the whole page to super admins. Wait for the profile to resolve so we
  // don't flash an access-denied screen during the initial load.
  if (!meLoading && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<Lock className="h-10 w-10 text-[var(--color-text-muted)]" />}
          title="Super admin access required"
          description="Only super admins can manage the admin team."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Admin Team</h1>
          <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Admin
          </Button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-[var(--color-background)] p-6 rounded-lg shadow-xl">
              <h2 className="text-xl font-bold mb-4">Create Admin Account</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@bexiemart.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Initial Password *</label>
                  <Input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 8 characters"
                  />
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Share this securely. The new admin should change it after first login.
                  </p>
                </div>
                <div className="flex gap-4 justify-end mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isPending} disabled={isPending}>
                    Create Admin
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8">
                <TableSkeleton rows={4} columns={4} />
              </div>
            ) : !admins || admins.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No admins found"
                description="Add an admin to grant portal access."
                action={<Button onClick={() => setIsModalOpen(true)}>Add Admin</Button>}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin: any) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        {admin.isSuperAdmin ? (
                          <Badge variant="info">Super Admin</Badge>
                        ) : (
                          <Badge variant="default">Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {admin.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="error">Disabled</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
