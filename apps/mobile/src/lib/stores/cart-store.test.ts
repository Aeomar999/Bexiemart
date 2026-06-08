jest.unmock("@/lib/stores/cart-store");
import { useCartStore } from "./cart-store";

describe("Cart Store", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("should add an item and calculate totals", () => {
    useCartStore.getState().addItem({
      id: "cart-1",
      productId: "prod-1",
      name: "Test Product",
      price: 100,
      quantity: 2,
      stock: 10,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.itemCount).toBe(2);
    expect(state.subtotal).toBe(200);
  });

  it("should update quantity within stock limits", () => {
    useCartStore.getState().addItem({
      id: "cart-1",
      productId: "prod-1",
      name: "Test Product",
      price: 100,
      quantity: 2,
      stock: 5,
    });

    useCartStore.getState().updateQuantity("prod-1", 10); // over stock

    let state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(5); // capped at stock
    expect(state.subtotal).toBe(500);

    useCartStore.getState().updateQuantity("prod-1", 0); // under 1
    state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(1); // capped at min 1
  });

  it("should remove an item completely", () => {
    useCartStore.getState().addItem({
      id: "cart-1",
      productId: "prod-1",
      name: "Test Product",
      price: 100,
      quantity: 2,
      stock: 5,
    });

    useCartStore.getState().removeItem("prod-1");

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.itemCount).toBe(0);
    expect(state.subtotal).toBe(0);
  });

  it("should merge quantities for existing items up to stock limit", () => {
    useCartStore.getState().addItem({
      id: "cart-1",
      productId: "prod-1",
      name: "Test Product",
      price: 100,
      quantity: 3,
      stock: 5,
    });

    useCartStore.getState().addItem({
      id: "cart-2", // different cart id, same product id
      productId: "prod-1",
      name: "Test Product",
      price: 100,
      quantity: 3,
      stock: 5,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(5); // 3 + 3 = 6, capped at 5
    expect(state.subtotal).toBe(500);
  });
});
