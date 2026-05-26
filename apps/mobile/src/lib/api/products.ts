export const productsApi = {
  getProducts: (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get("/products", { params }),

  getProduct: (id: string) => apiClient.get(`/products/${id}`),

  getCategories: () => apiClient.get("/products/categories"),
};

import { apiClient } from "./client";
