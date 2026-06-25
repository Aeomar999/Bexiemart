"use client";

import React, { useState } from "react";
import { useCoupons, useCreateCoupon } from "../../../../lib/hooks/use-marketing";
import { Pagination } from "../../../../components/ui/Pagination";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { Badge } from "../../../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { Ticket, Plus } from "lucide-react";
import { TableSkeleton } from "../../../../components/ui/Skeleton";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { toast } from "sonner";

export default function CouponsPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: response, isLoading } = useCoupons(page, limit);
  const { mutate: createCoupon, isPending } = useCreateCoupon();

  const coupons = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    usageLimit: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue || !formData.endDate) {
      toast.error("Please fill all required fields");
      return;
    }
    
    createCoupon(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({
          code: "",
          discountType: "PERCENTAGE",
          discountValue: "",
          minOrderAmount: "",
          maxDiscount: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          usageLimit: "",
        });
        toast.success("Coupon created successfully!");
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Discount Coupons</h1>
          <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Coupon
          </Button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-[var(--color-card)] text-[var(--color-text)] p-6 rounded-lg shadow-xl border border-[var(--color-border)]">
              <h2 className="text-xl font-bold mb-4">Create Global Coupon</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code *</label>
                  <Input 
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="SUMMER24"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select 
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                      value={formData.discountType}
                      onChange={e => setFormData({...formData, discountType: e.target.value})}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (GHS)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Value *</label>
                    <Input 
                      required
                      type="number"
                      value={formData.discountValue}
                      onChange={e => setFormData({...formData, discountValue: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <Input 
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">End Date *</label>
                    <Input 
                      required
                      type="date"
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-4 justify-end mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isPending} disabled={isPending}>Create Coupon</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Active Discount Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8"><TableSkeleton rows={5} columns={5} /></div>
            ) : coupons.length === 0 ? (
              <EmptyState 
                icon={<Ticket className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No coupons found"
                description="There are currently no active discount codes."
                action={<Button onClick={() => setIsModalOpen(true)}>Create Coupon</Button>}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Valid Until</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon: any) => {
                    const isExpired = new Date() > new Date(coupon.endDate);

                    return (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-medium font-mono bg-[var(--color-surface)] px-2 py-1 rounded w-fit">
                          {coupon.code}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{coupon.discountType}</Badge>
                        </TableCell>
                        <TableCell>
                          {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `GH₵ ${coupon.discountValue}`}
                        </TableCell>
                        <TableCell>{coupon.vendorId ? coupon.vendor?.shopName : "Platform-wide"}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(coupon.endDate).toLocaleDateString()}
                          {isExpired && <Badge variant="error" className="ml-2">Expired</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          
            {!isLoading && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
