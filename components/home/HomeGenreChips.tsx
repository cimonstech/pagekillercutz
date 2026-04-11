"use client";

import { useState } from "react";

const GENRES = [
  "Afrobeats",
  "Hip-Hop",
  "Trap",
  "House",
  "Amapiano",
  "Highlife",
  "Old School",
  "Drill",
] as const;

export default function HomeGenreChips() {
  const [selected, setSelected] = useState<string>("Afrobeats");

  return (
    <section aria-label="Genre filters">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {GENRES.map((g) => {
          const on = selected === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setSelected(g)}
              className={[
                "shrink-0 rounded-full px-4 py-2 font-headline text-xs transition-colors",
                on
                  ? "bg-[#00BFFF] font-semibold text-black"
                  : "border border-white/10 bg-white/[0.05] font-medium text-[#A0A8C0] hover:bg-white/10",
              ].join(" ")}
            >
              {g}
            </button>
          );
        })}
      </div>
    </section>
  );
}
