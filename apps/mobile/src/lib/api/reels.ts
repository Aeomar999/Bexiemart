import { apiClient } from "./client";
export const reelsApi = {
  getReels: (cursor?: string) => apiClient.get("/reels", { params: { cursor } }),
  getFollowing: (cursor?: string) => apiClient.get("/reels/following", { params: { cursor } }),
  toggleLike: (id: string) => apiClient.post(`/reels/${id}/like`),
  incrementView: (id: string) => apiClient.post(`/reels/${id}/view`),
  listComments: (reelId: string, cursor?: string) =>
    apiClient.get(`/reels/${reelId}/comments`, { params: { cursor } }),
  addComment: (reelId: string, content: string) =>
    apiClient.post(`/reels/${reelId}/comments`, { content }),
};
