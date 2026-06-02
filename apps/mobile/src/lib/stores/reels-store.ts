import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reelsApi } from "../api/reels";
import { logger } from "../logger";

export interface Comment {
  id: string;
  username: string;
  text: string;
  likes: number;
}

export interface ReelProduct {
  id: string; // product ID to link to
  name: string;
  price: number;
}

export interface Reel {
  id: string;
  vendorId: string;
  vendorName: string;
  description: string;
  videoUrl: string; // Since we don't have video, we'll use a high-res portrait image
  likes: number;
  comments: Comment[];
  shares: number;
  isLiked: boolean;
  isFollowing: boolean;
  product: ReelProduct;
}

interface ReelsState {
  reels: Reel[];
  isLoading: boolean;

  fetchReels: () => Promise<void>;
  toggleLikeReel: (reelId: string) => Promise<void>;
  toggleFollowVendor: (vendorId: string) => void;
  addComment: (reelId: string, text: string) => void;
  incrementShare: (reelId: string) => void;
  incrementView: (reelId: string) => Promise<void>;
  addReel: (reel: Reel) => void;
}

export const useReelsStore = create<ReelsState>()(
  persist(
    (set, get) => ({
      reels: [],
      isLoading: false,

      fetchReels: async () => {
        try {
          set({ isLoading: true });
          const response = await reelsApi.getReels();
          set({ reels: response.data, isLoading: false });
        } catch (error) {
          logger.error("Failed to fetch reels:", error);
          set({ isLoading: false });
        }
      },
      toggleLikeReel: async (reelId) => {
        // Optimistic update
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.id === reelId) {
              const isLiked = !reel.isLiked;
              return {
                ...reel,
                isLiked,
                likes: isLiked ? reel.likes + 1 : reel.likes - 1,
              };
            }
            return reel;
          }),
        }));

        try {
          await reelsApi.toggleLike(reelId);
        } catch (error) {
          logger.error("Failed to toggle like on reel:", error);
        }
      },

      toggleFollowVendor: (vendorId) =>
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.vendorId === vendorId) {
              return { ...reel, isFollowing: !reel.isFollowing };
            }
            return reel;
          }),
        })),

      addComment: (reelId, text) =>
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.id === reelId) {
              return {
                ...reel,
                comments: [
                  ...reel.comments,
                  { id: Math.random().toString(), username: "you", text, likes: 0 },
                ],
              };
            }
            return reel;
          }),
        })),

      incrementShare: (reelId) =>
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.id === reelId) {
              return { ...reel, shares: reel.shares + 1 };
            }
            return reel;
          }),
        })),

      incrementView: async (reelId) => {
        try {
          await reelsApi.incrementView(reelId);
        } catch (error) {
          logger.error("Failed to increment reel view:", error);
        }
      },

      addReel: (reel) =>
        set((state) => ({
          reels: [reel, ...state.reels],
        })),
    }),
    {
      name: "reels-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
