import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { productsApi } from "../api/products";
import { logger } from "../logger";

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviews: number;
  category: string;
  vendor: string;
  stock: number;
  image: string;
  subtitle?: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  count: number;
  image?: string;
}

interface ProductState {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  activeCategoryFilter: string;
  searchQuery: string;

  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setActiveCategoryFilter: (category: string) => void;
  setSearchQuery: (query: string) => void;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      isLoading: false,
      activeCategoryFilter: "All",
      searchQuery: "",

      setProducts: (products) => set({ products }),
      setCategories: (categories) => set({ categories }),
      setActiveCategoryFilter: (category) => {
        set({ activeCategoryFilter: category });
        get().fetchProducts();
      },
      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().fetchProducts();
      },

      fetchProducts: async () => {
        try {
          set({ isLoading: true });
          const { activeCategoryFilter, searchQuery } = get();
          const params: any = {};
          if (activeCategoryFilter !== "All") params.category = activeCategoryFilter;
          if (searchQuery) params.search = searchQuery;

          const response = await productsApi.getProducts(params);
          set({ products: response.data, isLoading: false });
        } catch (error) {
          logger.error("Failed to fetch products:", error);
          set({ isLoading: false });
        }
      },

      fetchCategories: async () => {
        try {
          const response = await productsApi.getCategories();
          set({ categories: [{ id: "all", name: "All", count: 0 }, ...response.data] });
        } catch (error) {
          logger.error("Failed to fetch categories:", error);
        }
      },
    }),
    {
      name: "product-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
