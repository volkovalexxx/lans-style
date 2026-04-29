import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavItem {
  productId: number;
  slug: string;
  nameRu: string;
  nameEn: string;
  priceByn: number;
  priceUsd: number;
  image?: string;
}

interface FavStore {
  items: FavItem[];
  addItem: (item: FavItem) => void;
  removeItem: (productId: number) => void;
  toggleItem: (item: FavItem) => void;
  isFavorite: (productId: number) => boolean;
}

export const useFavStore = create<FavStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (!get().isFavorite(item.productId)) {
          set({ items: [...get().items, item] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      toggleItem: (item) => {
        if (get().isFavorite(item.productId)) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },

      isFavorite: (productId) => get().items.some((i) => i.productId === productId),
    }),
    { name: 'lans-fav' }
  )
);
