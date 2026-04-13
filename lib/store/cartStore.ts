import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  size: string;
  colour: string;
  qty: number;
  image_url: string | null;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size: string, colour: string) => void;
  updateQty: (id: string, size: string, colour: string, qty: number) => void;
  clearCart: () => void;
  setIsOpen: (open: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const items = get().items;
        const existing = items.find(
          (i) =>
            i.id === newItem.id && i.size === newItem.size && i.colour === newItem.colour,
        );
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === newItem.id && i.size === newItem.size && i.colour === newItem.colour
                ? { ...i, qty: i.qty + newItem.qty }
                : i,
            ),
          });
        } else {
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (id, size, colour) =>
        set({
          items: get().items.filter(
            (i) => !(i.id === id && i.size === size && i.colour === colour),
          ),
        }),

      updateQty: (id, size, colour, qty) => {
        if (qty <= 0) {
          get().removeItem(id, size, colour);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id && i.size === size && i.colour === colour ? { ...i, qty } : i,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      setIsOpen: (open) => set({ isOpen: open }),
    }),
    { name: "killercutz-cart" },
  ),
);
