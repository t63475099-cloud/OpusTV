"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoriteItem {
  slug: string;
  name: string;
  poster: string;
  year?: number;
  addedAt: number;
}

interface FavState {
  favorites: FavoriteItem[];
  toggle: (item: FavoriteItem) => void;
  isFav: (slug: string) => boolean;
  remove: (slug: string) => void;
  clear: () => void;
}

export const useFavoritesStore = create<FavState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (item) => {
        set((state) => {
          const exists = state.favorites.some((f) => f.slug === item.slug);
          if (exists) {
            return { favorites: state.favorites.filter((f) => f.slug !== item.slug) };
          }
          return {
            favorites: [{ ...item, addedAt: Date.now() }, ...state.favorites].slice(0, 100),
          };
        });
      },
      isFav: (slug) => get().favorites.some((f) => f.slug === slug),
      remove: (slug) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.slug !== slug),
        })),
      clear: () => set({ favorites: [] }),
    }),
    { name: "opustv-favorites" }
  )
);
