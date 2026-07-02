"use client";

import React, { useState } from "react";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/Table";
import { Badge } from "../../../../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Pagination } from "../../../../components/ui/Pagination";
import { TableSkeleton } from "../../../../components/ui/Skeleton";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";
import { Image as ImageIcon, Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
} from "../../../../lib/hooks/use-banners";
import { Banner, BannerPlacement, BannerPayload } from "../../../../lib/api/banners";
import { uploadFile } from "../../../../lib/api/auth";

const PLACEMENTS: { value: BannerPlacement; label: string }[] = [
  { value: "HOME", label: "Home" },
  { value: "FOOD", label: "Food" },
  { value: "SERVICES", label: "Services" },
];

const EMPTY_FORM: BannerPayload = {
  placement: "HOME",
  title: "",
  subtitle: "",
  badge: "",
  imageUrl: "",
  ctaLabel: "",
  ctaRoute: "",
  isActive: true,
  sortOrder: 0,
};

const selectClass =
  "flex h-10 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

export default function BannersPage() {
  const [page, setPage] = useState(1);
  const [placementFilter, setPlacementFilter] = useState<BannerPlacement | "">("");
  const limit = 15;

  const { data: response, isLoading } = useBanners(page, limit, placementFilter || undefined);
  const { mutate: createBanner, isPending: isCreating } = useCreateBanner();
  const { mutate: updateBanner, isPending: isUpdating } = useUpdateBanner();
  const { mutate: deleteBanner, isPending: isDeleting } = useDeleteBanner();

  const banners = response?.data || [];
  const total = response?.meta?.total || 0;
  const totalPages = response?.meta?.totalPages || 1;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerPayload>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      placement: banner.placement,
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      badge: banner.badge ?? "",
      imageUrl: banner.imageUrl,
      ctaLabel: banner.ctaLabel ?? "",
      ctaRoute: banner.ctaRoute ?? "",
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      if (result?.url) setForm((f) => ({ ...f, imageUrl: result.url }));
    } catch {
      toast.error("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.imageUrl) {
      toast.error("Title and image are required");
      return;
    }
    // Drop empty optional strings so they persist as null rather than "".
    const payload: BannerPayload = {
      ...form,
      subtitle: form.subtitle || undefined,
      badge: form.badge || undefined,
      ctaLabel: form.ctaLabel || undefined,
      ctaRoute: form.ctaRoute || undefined,
      sortOrder: Number(form.sortOrder) || 0,
    };

    if (editingId) {
      updateBanner({ id: editingId, payload }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createBanner(payload, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteBanner(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const isSaving = isCreating || isUpdating;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Banners</h1>
          <div className="flex items-center gap-3">
            <select
              className={selectClass + " w-auto"}
              value={placementFilter}
              onChange={(e) => {
                setPlacementFilter(e.target.value as BannerPlacement | "");
                setPage(1);
              }}
            >
              <option value="">All placements</option>
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <Button className="flex items-center gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create Banner
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Promotional Banners</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8">
                <TableSkeleton rows={4} columns={6} />
              </div>
            ) : banners.length === 0 ? (
              <EmptyState
                icon={<ImageIcon className="h-10 w-10 text-[var(--color-text-muted)]" />}
                title="No banners yet"
                description="Create a promotional banner to feature on the customer app."
                action={<Button onClick={openCreate}>Create Banner</Button>}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <div className="relative h-10 w-16 overflow-hidden rounded-md bg-[var(--color-surface-100)]">
                          {banner.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {banner.title}
                        {banner.subtitle && (
                          <p className="text-xs text-[var(--color-text-muted)]">{banner.subtitle}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{banner.placement}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={banner.isActive ? "success" : "default"}>
                          {banner.isActive ? "Active" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell>{banner.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(banner)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(banner)}
                          >
                            <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && banners.length > 0 && (
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            )}
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-[var(--color-text)] shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editingId ? "Edit Banner" : "Create Banner"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image upload + preview */}
              <div>
                <label className="mb-1 block text-sm font-medium">Banner Image *</label>
                <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-100)]">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imageUrl}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">No image selected</span>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <label className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1 rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white">
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <Input
                  className="mt-2"
                  placeholder="…or paste an image URL"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">Placement *</label>
                  <select
                    className={selectClass}
                    value={form.placement}
                    onChange={(e) =>
                      setForm({ ...form, placement: e.target.value as BannerPlacement })
                    }
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-sm font-medium">Sort Order</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Title *</label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Holiday Deals Are Live!"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Subtitle</label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Up to 50% off"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">Badge</label>
                  <Input
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="Limited Offer"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">CTA Label</label>
                  <Input
                    value={form.ctaLabel}
                    onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                    placeholder="Order Now"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">CTA Route</label>
                <Input
                  value={form.ctaRoute}
                  onChange={(e) => setForm({ ...form, ctaRoute: e.target.value })}
                  placeholder="/(customer)/flash-sales"
                />
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Where tapping the banner sends the customer. Leave blank for a non-tappable banner.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--color-border)]"
                />
                Active (visible in the app)
              </label>

              <div className="mt-6 flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving} disabled={isSaving || isUploading}>
                  {editingId ? "Save Changes" : "Create Banner"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete banner"
        description={`Remove "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}
