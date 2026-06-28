"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useVendors } from "../../../lib/hooks/use-vendors";
import { useDebounce } from "../../../lib/hooks/use-debounce";
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
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Search, Store } from "lucide-react";
import { TableSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Pagination } from "../../../components/ui/Pagination";
import { exportToCsv } from "../../../lib/utils/export";

export default function VendorsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Real data
  const { data: response, isLoading } = useVendors({ page, limit, search: debouncedSearch });
  const vendors = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  const handleExport = () => {
    exportToCsv(vendors, "bexiemart-vendors");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Vendors</h1>
          <Button variant="primary" onClick={handleExport} disabled={vendors.length === 0}>Export List</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 pb-4">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                <Input
                  placeholder="Search vendors..."
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
                <TableSkeleton rows={5} columns={5} />
              </div>
            ) : vendors.length === 0 ? (
              <EmptyState 
                icon={<Store className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No vendors found"
                description={debouncedSearch ? "We couldn't find any vendors matching your search." : "No vendors have registered yet."}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor: any) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.businessName}</TableCell>
                      <TableCell>{vendor.user?.name}</TableCell>
                      <TableCell>{vendor.orders?.length || 0}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            vendor.verificationStatus === "APPROVED" ? "success" : 
                            vendor.verificationStatus === "PENDING" ? "warning" : "error"
                          }
                        >
                          {vendor.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/vendors/${vendor.id}`)}>Review</Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
