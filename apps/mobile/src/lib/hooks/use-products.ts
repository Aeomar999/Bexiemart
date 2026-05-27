import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/products";

export const PRODUCT_KEYS = {
  all: ["products"] as const,
  list: (params?: object) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  store: (id: string) => ["products", "store", id] as const,
  categories: ["products", "categories"] as const,
};

export function useProducts(params?: {
  category?: string;
  search?: string;
  vendorId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(params),
    queryFn: () => productsApi.getProducts(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => productsApi.getProduct(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useStoreProfile(id: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.store(id),
    queryFn: () => productsApi.getStore(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: PRODUCT_KEYS.categories,
    queryFn: () => productsApi.getCategories().then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}
