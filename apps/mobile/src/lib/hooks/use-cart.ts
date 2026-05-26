import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api/cart";
import { useCartStore } from "../stores/cart-store";

export const CART_KEYS = {
  cart: ["cart"] as const,
};

export function useCart() {
  const setItems = useCartStore((s) => s.setItems);

  return useQuery({
    queryKey: CART_KEYS.cart,
    queryFn: async () => {
      const r = await cartApi.getCart();
      setItems(r.data.items ?? []);
      return r.data;
    },
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.addItem(productId, quantity),
    onMutate: async ({ productId, quantity }) => {
      addItem({ id: "", productId, name: "", price: 0, quantity, imageUrl: "", stock: 99 });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEYS.cart }),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; productId: string; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onMutate: async ({ productId, quantity }) => {
      updateQuantity(productId, quantity);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEYS.cart }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  const removeItem = useCartStore((s) => s.removeItem);

  return useMutation({
    mutationFn: ({ itemId, productId }: { itemId: string; productId: string }) =>
      cartApi.removeItem(itemId),
    onMutate: async ({ productId }) => {
      removeItem(productId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEYS.cart }),
  });
}
