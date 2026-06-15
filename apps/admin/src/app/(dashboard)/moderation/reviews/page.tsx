"use client";

import React, { useState } from "react";
import { useReviews, useDeleteReview } from "../../../../lib/hooks/use-moderation";
import { Pagination } from "../../../../components/ui/Pagination";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { MessageSquareWarning, Trash2, Star } from "lucide-react";
import { TableSkeleton } from "../../../../components/ui/Skeleton";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Button } from "../../../../components/ui/Button";
import { toast } from "sonner";

export default function ReviewsModerationPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: response, isLoading } = useReviews(page, limit);
  const { mutate: deleteReview, isPending } = useDeleteReview();

  const reviews = response?.data || [];

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      deleteReview(id, {
        onSuccess: () => {
          toast.success("Review deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete review");
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Product Reviews</h1>

        <Card>
          <CardHeader>
            <CardTitle>Review Moderation</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8"><TableSkeleton rows={5} columns={5} /></div>
            ) : reviews.length === 0 ? (
              <EmptyState 
                icon={<MessageSquareWarning className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No reviews found"
                description="There are currently no reviews on the platform."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Product / Vendor</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.user?.name || "Anonymous"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{review.product?.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{review.product?.vendor?.shopName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{review.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={review.comment}>
                        {review.comment || <span className="text-[var(--color-text-muted)] italic">No comment provided</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[var(--color-error)] hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(review.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          
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
    </DashboardLayout>
  );
}
