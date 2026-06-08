jest.unmock("@/lib/stores/food-cart-store");
import { useFoodCartStore, getCartItemCount, getCartSubtotal } from "./food-cart-store";

const item1 = { id: "f1", restaurantId: "r1", restaurantName: "Pizza Place", name: "Margherita", price: 50, quantity: 2 };
const item2 = { id: "f2", restaurantId: "r1", restaurantName: "Pizza Place", name: "Pepperoni", price: 60, quantity: 1 };

describe("Food Cart Store", () => {
  beforeEach(() => {
    useFoodCartStore.setState({ items: [] });
  });

  it("should add new item", () => {
    useFoodCartStore.getState().addItem(item1);
    expect(useFoodCartStore.getState().items).toHaveLength(1);
  });

  it("should merge quantity for existing item", () => {
    useFoodCartStore.getState().addItem(item1);
    useFoodCartStore.getState().addItem({ ...item1, quantity: 3 });
    expect(useFoodCartStore.getState().items).toHaveLength(1);
    expect(useFoodCartStore.getState().items[0].quantity).toBe(5);
  });

  it("should remove item", () => {
    useFoodCartStore.setState({ items: [item1, item2] });
    useFoodCartStore.getState().removeItem("f1");
    expect(useFoodCartStore.getState().items).toHaveLength(1);
    expect(useFoodCartStore.getState().items[0].id).toBe("f2");
  });

  it("should update quantity", () => {
    useFoodCartStore.setState({ items: [item1] });
    useFoodCartStore.getState().updateQuantity("f1", 5);
    expect(useFoodCartStore.getState().items[0].quantity).toBe(5);
  });

  it("should clear cart", () => {
    useFoodCartStore.setState({ items: [item1, item2] });
    useFoodCartStore.getState().clearCart();
    expect(useFoodCartStore.getState().items).toHaveLength(0);
  });

  it("should compute item count via helper", () => {
    useFoodCartStore.setState({ items: [item1, item2] });
    expect(getCartItemCount(useFoodCartStore.getState())).toBe(3);
  });

  it("should compute subtotal via helper", () => {
    useFoodCartStore.setState({ items: [item1, item2] });
    expect(getCartSubtotal(useFoodCartStore.getState())).toBe(160);
  });
});
