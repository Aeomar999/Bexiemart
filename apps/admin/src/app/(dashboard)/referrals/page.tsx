"use client";

import React, { useState } from "react";
import { useReferrals } from "../../../lib/hooks/use-referrals";
import { Pagination } from "../../../components/ui/Pagination";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Ticket, Users } from "lucide-react";
import { TableSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Badge } from "../../../components/ui/Badge";

export default function ReferralsPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: response, isLoading } = useReferrals(page, limit);
  const referrals = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Referrals Program</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{total}</div>
            
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

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8"><TableSkeleton rows={5} columns={4} /></div>
            ) : referrals.length === 0 ? (
              <EmptyState 
                icon={<Ticket className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No referrals found"
                description="The referral program hasn't generated any invites yet."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Users Invited</TableHead>
                    <TableHead>Total Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral: any) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{referral.user?.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{referral.user?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="font-mono">{referral.referralCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
                          <span>{referral._count?.referredUsers || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>GH₵ {referral.totalEarned}</TableCell>
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
