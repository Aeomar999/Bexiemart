"use client";

import React, { useState } from "react";
import { useFlashSales, useCreateFlashSale } from "../../../../lib/hooks/use-marketing";
import { Pagination } from "../../../../components/ui/Pagination";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { Badge } from "../../../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { Zap, Plus } from "lucide-react";
import { TableSkeleton } from "../../../../components/ui/Skeleton";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { toast } from "sonner";

export default function FlashSalesPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: response, isLoading } = useFlashSales(page, limit);
  const { mutate: createFlashSale, isPending } = useCreateFlashSale();

  const flashSales = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    discountPercentage: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.discountPercentage || !formData.endDate) {
      toast.error("Please fill all required fields");
      return;
    }
    
    createFlashSale(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({
          name: "",
          discountPercentage: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
        });
        toast.success("Flash sale created successfully!");
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Flash Sales</h1>
          <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-[var(--color-card)] text-[var(--color-text)] p-6 rounded-lg shadow-xl border border-[var(--color-border)]">
              <h2 className="text-xl font-bold mb-4">Create Global Flash Sale</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign Name *</label>
                  <Input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Weekend Super Sale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Global Discount Percentage (%) *</label>
                  <Input 
                    required
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={e => setFormData({...formData, discountPercentage: e.target.value})}
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    This discount will be applied platform-wide during the selected period.
                  </p>
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
                  <Button type="submit" isLoading={isPending} disabled={isPending}>Create Campaign</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8"><TableSkeleton rows={4} columns={5} /></div>
            ) : flashSales.length === 0 ? (
              <EmptyState 
                icon={<Zap className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No active flash sales"
                description="There are currently no flash sales running."
                action={<Button onClick={() => setIsModalOpen(true)}>Create Campaign</Button>}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Products Enrolled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flashSales.map((sale: any) => {
                    const now = new Date();
                    const start = new Date(sale.startDate);
                    const end = new Date(sale.endDate);
                    const isUpcoming = now < start;
                    const isExpired = now > end;
                    
                    let statusVariant: "success" | "warning" | "error" | "default" = "success";
                    let statusText = "Active";
                    
                    if (isUpcoming) {
                      statusVariant = "warning";
                      statusText = "Upcoming";
                    } else if (isExpired) {
                      statusVariant = "error";
                      statusText = "Expired";
                    }

                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.name}</TableCell>
                        <TableCell>{sale.discountPercentage}% OFF</TableCell>
                        <TableCell>{sale._count?.items || 0} items</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant}>{statusText}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {end.toLocaleDateString()}
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
