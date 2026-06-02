import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface FoodCartItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  quantity: number;
}

interface FoodCartState {
  items: FoodCartItem[];
  addItem: (item: FoodCartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  get subtotal(): number;
  get itemCount(): number;
}

export const useFoodCartStore = create<FoodCartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,

      addItem: (newItem) =>
        set((state) => {
          // If adding from a different restaurant, we might want to warn or clear,
          // but for now we'll allow it or just add it. Let's group them or just add.
          const existingItem = state.items.find((i) => i.id === newItem.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "food-cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const getCartItemCount = (state: FoodCartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0);

export const getCartSubtotal = (state: FoodCartState) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0);
