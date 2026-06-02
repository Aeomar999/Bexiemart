import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionsApi } from "../api/collections";
import Toast from "@/lib/toast-polyfill";

export const COLLECTIONS_KEYS = {
  all: ["collections"] as const,
  detail: (id: string) => ["collections", id] as const,
};

export function useCollections() {
  return useQuery({
    queryKey: COLLECTIONS_KEYS.all,
    queryFn: () => collectionsApi.getCollections().then((r) => r.data.data),
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: COLLECTIONS_KEYS.detail(id),
    queryFn: () => collectionsApi.getCollection(id).then((r) => r.data.data),
    enabled: !!id && id !== "all",
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      collectionsApi.createCollection(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.all });
      Toast.show({ type: "success", text1: "Collection Created" });
    },
    onError: (err: any) => {
      Toast.show({
        type: "error",
        text1: "Failed to create collection",
        text2: err?.response?.data?.message || err.message,
      });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => collectionsApi.deleteCollection(id).then((r) => r.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.all });
      queryClient.removeQueries({ queryKey: COLLECTIONS_KEYS.detail(id) });
      Toast.show({ type: "success", text1: "Collection Deleted" });
    },
  });
}

export function useAddCollectionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, productId }: { collectionId: string; productId: string }) =>
      collectionsApi.addItem(collectionId, productId).then((r) => r.data),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.detail(collectionId) });
      Toast.show({ type: "success", text1: "Added to Collection" });
    },
  });
}

export function useRemoveCollectionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, productId }: { collectionId: string; productId: string }) =>
      collectionsApi.removeItem(collectionId, productId).then((r) => r.data),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.detail(collectionId) });
      Toast.show({ type: "success", text1: "Removed from Collection" });
    },
  });
}
