jest.unmock("@/lib/stores/favorites-store");
import { useFavoritesStore } from "./favorites-store";

describe("Favorites Store", () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: new Set<string>() });
  });

  it("should toggle favorite on", () => {
    useFavoritesStore.getState().toggleFavorite("p1");
    expect(useFavoritesStore.getState().isFavorite("p1")).toBe(true);
  });

  it("should toggle favorite off", () => {
    useFavoritesStore.setState({ favorites: new Set(["p1"]) });
    useFavoritesStore.getState().toggleFavorite("p1");
    expect(useFavoritesStore.getState().isFavorite("p1")).toBe(false);
  });

  it("should handle multiple favorites", () => {
    useFavoritesStore.getState().toggleFavorite("p1");
    useFavoritesStore.getState().toggleFavorite("p2");
    expect(useFavoritesStore.getState().isFavorite("p1")).toBe(true);
    expect(useFavoritesStore.getState().isFavorite("p2")).toBe(true);
    expect(useFavoritesStore.getState().isFavorite("p3")).toBe(false);
  });
});
