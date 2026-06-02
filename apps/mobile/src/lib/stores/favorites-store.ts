import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface FavoritesState {
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: new Set<string>(),
      toggleFavorite: (id: string) =>
        set((state) => {
          const next = new Set(state.favorites);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return { favorites: next };
        }),
      isFavorite: (id: string) => get().favorites.has(id),
    }),
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
