import { create } from "zustand";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;

  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  subtotal: 0,

  setItems: (items) =>
    set({
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),

  addItem: (item) => {
    const items = [...get().items];
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + item.quantity, existing.stock);
    } else {
      items.push(item);
    }
    set({
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    });
  },

  updateQuantity: (productId, quantity) => {
    const items = get()
      .items.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i
      )
      .filter((i) => i.quantity > 0);
    set({
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    });
  },

  removeItem: (productId) => {
    const items = get().items.filter((i) => i.productId !== productId);
    set({
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    });
  },

  clearCart: () => set({ items: [], itemCount: 0, subtotal: 0 }),
}));
