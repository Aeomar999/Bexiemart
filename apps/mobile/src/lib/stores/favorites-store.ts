import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (id: string) =>
        set((state) => {
          const currentFavs = Array.isArray(state.favorites) ? state.favorites : [];
          const next = [...currentFavs];
          const index = next.indexOf(id);
          if (index !== -1) {
            next.splice(index, 1);
          } else {
            next.push(id);
          }
          return { favorites: next };
        }),
      isFavorite: (id: string) => {
        // Fallback to empty array if favorites somehow got corrupted to an object (e.g. from previous bad Set serialization)
        const favs = Array.isArray(get().favorites) ? get().favorites : [];
        return favs.includes(id);
      },
    }),
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
