export const productsApi = {
  getProducts: (params?: {
    category?: string;
    search?: string;
    vendorId?: string;
    page?: number;
    limit?: number;
    cursor?: string;
  }) => apiClient.get("/products", { params }),

  getProduct: (id: string) => apiClient.get(`/products/${id}`),

  getStore: (id: string) => apiClient.get(`/products/store/${id}`),

  getCategories: () => apiClient.get("/products/categories"),
};

import { apiClient } from "./client";
