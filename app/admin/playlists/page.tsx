"use client";

import { Suspense } from "react";
import PlaylistsTab from "@/components/admin/PlaylistsTab";

function Fallback() {
  return <p className="text-on-surface-variant text-sm p-8">Loading playlists…</p>;
}

export default function AdminPlaylistsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PlaylistsTab />
    </Suspense>
  );
}
