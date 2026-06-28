"use client";

import React, { useState } from "react";
import { useReels, useToggleReelStatus } from "../../../../lib/hooks/use-moderation";
import { Pagination } from "../../../../components/ui/Pagination";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { Badge } from "../../../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { ShieldAlert, PlayCircle, EyeOff, Eye } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { toast } from "sonner";

export default function ReelsModerationPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useReels(page, limit);
  const { mutate: toggleStatus, isPending } = useToggleReelStatus();

  const reels = response?.data || [];

  const handleToggle = (id: string, currentlyActive: boolean) => {
    toggleStatus(id, {
      onSuccess: () => {
        toast.success(`Reel has been ${currentlyActive ? 'hidden' : 'published'}`);
      },
      onError: () => {
        toast.error("Failed to update reel status");
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Reels Moderation</h1>

        <Card>
          <CardHeader>
            <CardTitle>Content Moderation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-64 bg-[var(--color-surface)] rounded-md animate-pulse"></div>
                ))}
              </div>
            ) : reels.length === 0 ? (
              <EmptyState 
                icon={<ShieldAlert className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No reels found"
                description="No video content has been uploaded yet."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reels.map((reel: any) => (
                  <div key={reel.id} className="group relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:shadow-md">
                    {/* Video Thumbnail Placeholder */}
                    <div className="aspect-[9/16] bg-gray-900 relative flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-white/50" />
                      <div className="absolute top-2 right-2">
                        <Badge variant={reel.isActive ? "success" : "error"}>
                          {reel.isActive ? "LIVE" : "HIDDEN"}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                        <p className="text-sm font-medium truncate">{reel.product?.name || "Product Name"}</p>
                        <p className="text-xs opacity-80">By @{reel.user?.name}</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-[var(--color-card)]">
                      <Button 
                        variant={reel.isActive ? "outline" : "primary"}
                        className="w-full flex items-center justify-center gap-2"
                        size="sm"
                        onClick={() => handleToggle(reel.id, reel.isActive)}
                        disabled={isPending}
                      >
                        {reel.isActive ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Take Down
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Restore
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
