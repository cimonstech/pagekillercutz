import { create } from "zustand";

type AdminStore = {
  role: "super_admin" | "admin" | null;
  setRole: (role: "super_admin" | "admin" | null) => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}));
