import { create } from "zustand";

export type AdminTab =
  | "overview"
  | "bookings"
  | "playlists"
  | "orders"
  | "packages"
  | "music"
  | "events"
  | "accounts"
  | "audit-log";

type AdminStore = {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  role: "super_admin" | "admin" | null;
  setRole: (role: "super_admin" | "admin" | null) => void;
  playlistEventIdFilter: string | null;
  setPlaylistEventIdFilter: (eventId: string | null) => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  activeTab: "overview",
  setActiveTab: (tab) => set({ activeTab: tab }),
  role: null,
  setRole: (role) => set({ role }),
  playlistEventIdFilter: null,
  setPlaylistEventIdFilter: (eventId) => set({ playlistEventIdFilter: eventId }),
}));
