import { create } from "zustand";

type AdminStore = {
  role: "super_admin" | "admin" | null;
  staffEmail: string | null;
  setSession: (p: { role: "super_admin" | "admin" | null; staffEmail: string | null }) => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  role: null,
  staffEmail: null,
  setSession: (p) => set({ role: p.role, staffEmail: p.staffEmail }),
}));
