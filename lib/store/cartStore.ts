import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  size?: string;
  color?: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i,
          ),
        };
      }
      return { items: [...state.items, { ...item, qty: item.qty ?? 1 }] };
    }),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQty: (id, qty) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)),
    })),
  clearCart: () => set({ items: [] }),
}));
