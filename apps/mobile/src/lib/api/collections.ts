import { apiClient } from "./client";

export const collectionsApi = {
  getCollections: () => apiClient.get("/collections"),
  getCollection: (id: string) => apiClient.get(`/collections/${id}`),
  createCollection: (data: { name: string; description?: string }) =>
    apiClient.post("/collections", data),
  deleteCollection: (id: string) => apiClient.delete(`/collections/${id}`),
  addItem: (collectionId: string, productId: string) =>
    apiClient.post(`/collections/${collectionId}/items`, { productId }),
  removeItem: (collectionId: string, productId: string) =>
    apiClient.delete(`/collections/${collectionId}/items/${productId}`),
};
