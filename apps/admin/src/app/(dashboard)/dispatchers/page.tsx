"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatchers } from "../../../lib/hooks/use-dispatchers";
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
import { Bike, Search } from "lucide-react";
import { TableSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Input } from "../../../components/ui/Input";
import { Pagination } from "../../../components/ui/Pagination";
import { useDebounce } from "../../../lib/hooks/use-debounce";
import { exportToCsv } from "../../../lib/utils/export";

export default function DispatchersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: response, isLoading } = useDispatchers({ page, limit, search: debouncedSearch });
  const dispatchers = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  const handleExport = () => {
    exportToCsv(dispatchers, "bexiemart-dispatchers");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Dispatchers</h1>
          <Button variant="primary" onClick={handleExport} disabled={dispatchers.length === 0}>Export List</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dispatcher Fleet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 pb-4">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                <Input
                  placeholder="Search dispatchers..."
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
                <TableSkeleton rows={5} columns={6} />
              </div>
            ) : dispatchers.length === 0 ? (
              <EmptyState 
                icon={<Bike className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No dispatchers found"
                description={debouncedSearch ? "We couldn't find any dispatchers matching your search." : "No dispatchers have registered yet."}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Vehicle Type</TableHead>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Completed Deliveries</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchers.map((dispatcher: any) => (
                    <TableRow key={dispatcher.id}>
                      <TableCell className="font-medium">{dispatcher.user?.name}</TableCell>
                      <TableCell className="capitalize">{dispatcher.vehicleType?.toLowerCase()}</TableCell>
                      <TableCell>{dispatcher.licensePlate}</TableCell>
                      <TableCell>{dispatcher.totalTrips ?? 0}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            dispatcher.verificationStatus === "APPROVED" ? "success" : 
                            dispatcher.verificationStatus === "PENDING" ? "warning" : "error"
                          }
                        >
                          {dispatcher.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dispatchers/${dispatcher.id}`)}>Review</Button>
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
