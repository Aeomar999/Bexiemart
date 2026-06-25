import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foodApi, FoodCheckoutDto } from "../api/food";

export function useFoodRestaurants(params?: { category?: string }) {
  return useQuery({
    queryKey: ["food", "restaurants", params],
    queryFn: () => foodApi.getRestaurants(params).then((r) => r.data.data ?? r.data),
  });
}

export function useFoodRestaurant(id: string) {
  return useQuery({
    queryKey: ["food", "restaurants", id],
    queryFn: () => foodApi.getRestaurant(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useFoodItems(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ["food", "items", params],
    queryFn: () => foodApi.getItems(params).then((r) => r.data.data ?? r.data),
  });
}

export function useFoodCart() {
  return useQuery({
    queryKey: ["food", "cart"],
    queryFn: () => foodApi.getCart().then((r) => r.data),
  });
}

export function useAddToFoodCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { foodItemId: string; quantity: number; specialInstructions?: string }) =>
      foodApi.addToCart(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food", "cart"] }),
  });
}

export function useUpdateFoodCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      foodApi.updateCartItem(id, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food", "cart"] }),
  });
}

export function useRemoveFoodCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => foodApi.removeCartItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food", "cart"] }),
  });
}

export function useClearFoodCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => foodApi.clearCart(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food", "cart"] }),
  });
}

export function useFoodCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto?: FoodCheckoutDto) => foodApi.checkout(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food", "cart"] });
      qc.invalidateQueries({ queryKey: ["food", "orders"] });
    },
  });
}

export function useFoodOrders() {
  return useQuery({
    queryKey: ["food", "orders"],
    queryFn: () => foodApi.getOrders().then((r) => r.data.data ?? r.data),
  });
}

export function useFoodOrder(id: string) {
  return useQuery({
    queryKey: ["food", "orders", id],
    queryFn: () => foodApi.getOrder(id).then((r) => r.data),
    enabled: !!id,
  });
}
