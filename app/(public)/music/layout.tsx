import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Music — Mixes, Albums & Releases",
  },
  description:
    "Listen to Page KillerCutz mixes, albums, and singles — Afrobeats, Highlife, Amapiano, and more from Accra's premier scratch DJ.",
  alternates: {
    canonical: "https://pagekillercutz.com/music",
  },
};

export default function MusicSectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
