jest.mock("../api/products", () => ({
  productsApi: {
    getProducts: jest.fn(),
    getCategories: jest.fn(),
  },
}));
jest.mock("../logger", () => ({ logger: { error: jest.fn() } }));

import { useProductStore } from "./product-store";
import { productsApi } from "../api/products";

const mockProducts = { data: [{ id: "p1", name: "Product 1", price: 100, oldPrice: 120, rating: 4.5, reviews: 10, category: "Electronics", vendor: "Vendor A", stock: 5, image: "img1.jpg" }] };
const mockCategories = { data: [{ id: "cat1", name: "Clothing", count: 5, image: "cat1.jpg" }] };

describe("Product Store", () => {
  beforeEach(() => {
    useProductStore.setState({ products: [], categories: [], isLoading: false, activeCategoryFilter: "All", searchQuery: "" });
    jest.clearAllMocks();
  });

  it("should fetch products", async () => {
    (productsApi.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    await useProductStore.getState().fetchProducts();
    expect(useProductStore.getState().products).toHaveLength(1);
    expect(useProductStore.getState().isLoading).toBe(false);
  });

  it("should pass category filter when fetching", async () => {
    useProductStore.setState({ activeCategoryFilter: "Clothing" });
    (productsApi.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    await useProductStore.getState().fetchProducts();
    expect(productsApi.getProducts).toHaveBeenCalledWith({ category: "Clothing" });
  });

  it("should pass search query when fetching", async () => {
    useProductStore.setState({ searchQuery: "phone" });
    (productsApi.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    await useProductStore.getState().fetchProducts();
    expect(productsApi.getProducts).toHaveBeenCalledWith({ search: "phone" });
  });

  it("should handle fetch products error", async () => {
    (productsApi.getProducts as jest.Mock).mockRejectedValue(new Error("network"));
    await useProductStore.getState().fetchProducts();
    expect(useProductStore.getState().isLoading).toBe(false);
  });

  it("should fetch categories and prepend All", async () => {
    (productsApi.getCategories as jest.Mock).mockResolvedValue(mockCategories);
    await useProductStore.getState().fetchCategories();
    const cats = useProductStore.getState().categories;
    expect(cats).toHaveLength(2);
    expect(cats[0].name).toBe("All");
  });

  it("should handle fetch categories error", async () => {
    (productsApi.getCategories as jest.Mock).mockRejectedValue(new Error("network"));
    await useProductStore.getState().fetchCategories();
    expect(useProductStore.getState().categories).toHaveLength(0);
  });

  it("should set products directly", () => {
    useProductStore.getState().setProducts([{ id: "p1", name: "Test", price: 50, oldPrice: 60, rating: 4, reviews: 5, category: "C", vendor: "V", stock: 10, image: "img.jpg" }]);
    expect(useProductStore.getState().products).toHaveLength(1);
  });

  it("should set categories directly", () => {
    useProductStore.getState().setCategories([{ id: "c1", name: "Books", count: 3 }]);
    expect(useProductStore.getState().categories).toHaveLength(1);
  });

  it("should set activeCategoryFilter and fetch", async () => {
    (productsApi.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    useProductStore.getState().setActiveCategoryFilter("Clothing");
    expect(useProductStore.getState().activeCategoryFilter).toBe("Clothing");
    expect(productsApi.getProducts).toHaveBeenCalled();
  });

  it("should set search query and fetch", async () => {
    (productsApi.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    useProductStore.getState().setSearchQuery("shoes");
    expect(useProductStore.getState().searchQuery).toBe("shoes");
    expect(productsApi.getProducts).toHaveBeenCalled();
  });
});
