'use client'

import Link from 'next/link'

interface TopNavbarProps {
  /** Width of the sidebar to offset the navbar (e.g. 72 for app, 200 for admin) */
  sidebarWidth?: number
  searchPlaceholder?: string
  /** Show notification bell */
  showNotifications?: boolean
  /** Show avatar */
  showAvatar?: boolean
  /** Custom right-side content */
  rightSlot?: React.ReactNode
  /** Page title shown on admin bar */
  title?: string
}

export default function TopNavbar({
  sidebarWidth = 72,
  searchPlaceholder = 'Search...',
  showNotifications = true,
  showAvatar = true,
  rightSlot,
  title,
}: TopNavbarProps) {
  return (
    <header
      className="fixed top-0 right-0 z-40 flex justify-between items-center px-8 h-16 bg-transparent"
      style={{ left: sidebarWidth }}
    >
      {/* Left: brand or title */}
      <div className="font-display font-extrabold text-2xl text-[#00BFFF] uppercase tracking-widest">
        {title ?? 'KillerCutz'}
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-6 text-[#bcc8d1]">
        {/* Search */}
        <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/15">
          <span className="material-symbols-outlined text-sm">search</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="bg-transparent border-none outline-none focus:ring-0 text-sm placeholder:text-on-surface-variant/50 w-48 text-on-surface"
          />
        </div>

        {showNotifications && (
          <button aria-label="Notifications" className="hover:text-white transition-colors cursor-pointer relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
          </button>
        )}

        {showAvatar && (
          <div className="w-10 h-10 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
          </div>
        )}

        {rightSlot}
      </div>
    </header>
  )
}

/* ─── App-specific variant (used in (app) group) ─────────────────────── */
export function AppTopNavbar() {
  return (
    <TopNavbar
      sidebarWidth={72}
      searchPlaceholder="Search tracks..."
      showNotifications
      showAvatar
    />
  )
}

/* ─── Admin-specific variant (used in admin group) ───────────────────── */
export function AdminTopNavbar({ title = 'KillerCutz Admin' }: { title?: string }) {
  return (
    <TopNavbar
      sidebarWidth={200}
      searchPlaceholder="Search..."
      showNotifications
      showAvatar
      title={title}
    />
  )
}
