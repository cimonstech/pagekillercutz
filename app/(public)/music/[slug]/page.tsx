"use client";

import Image from "next/image";
import { ArrowLeft, CalendarDays, Clock3, Copy, Music, Music2, Play, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { AlbumTrack, Database } from "@/lib/database.types";
import { formatDuration } from "@/lib/player-utils";

type MusicRow = Database["public"]["Tables"]["music"]["Row"];

function LoadingSkeleton() {
  return (
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "40px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            flexShrink: 0,
            animation: "kc-shimmer 1.5s infinite",
          }}
        />
        <div style={{ flex: 1, minWidth: 320 }}>
          <div
            style={{
              height: 48,
              width: "80%",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 8,
              marginBottom: 12,
              animation: "kc-shimmer 1.5s infinite",
            }}
          />
          <div
            style={{
              height: 20,
              width: "40%",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              animation: "kc-shimmer 1.5s infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  const router = useRouter();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        gap: "16px",
      }}
    >
      <Music size={48} color="rgba(255,255,255,0.20)" />
      <h2 style={{ fontFamily: "Space Grotesk", fontSize: "24px", color: "white", fontWeight: 600 }}>Release not found</h2>
      <p style={{ fontFamily: "Inter", fontSize: "14px", color: "#A0A8C0" }}>This release may have been removed.</p>
      <button
        onClick={() => router.push("/music")}
        style={{
          padding: "12px 24px",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "999px",
          color: "white",
          fontFamily: "Space Grotesk",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        ← Back to Music
      </button>
    </div>
  );
}

function formatReleaseDate(value: string | null) {
  if (!value) return "Unknown release date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown release date";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function MusicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const musicId = params.slug as string;
  const [music, setMusic] = useState<MusicRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setTrack = usePlayerStore((s) => s.setTrack);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  useEffect(() => {
    if (!musicId) return;
    let cancelled = false;
    fetch(`/api/music/${musicId}`)
      .then((res) => {
        if (!res.ok) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return null;
        }
        return res.json();
      })
      .then((data: { music?: MusicRow } | null) => {
        if (cancelled || !data) return;
        setMusic(data.music ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setNotFound(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [musicId]);

  const tracks = useMemo(() => {
    const raw = music?.tracks;
    return Array.isArray(raw) ? (raw as AlbumTrack[]) : [];
  }, [music?.tracks]);

  if (loading) return <LoadingSkeleton />;
  if (notFound || !music) return <NotFound />;

  const isThisPlaying = currentTrack?.id === music.id && isPlaying;
  const cover = music.cover_url && music.cover_url.startsWith("http") ? music.cover_url : null;
  const typeColor =
    music.type === "album" ? "#00BFFF" : music.type === "single" ? "#F5A623" : "#9B7BFF";

  return (
    <div className="relative min-h-screen px-6 py-8 sm:px-10">
      {cover ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: `url(${cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(80px) brightness(0.15) saturate(150%)",
            zIndex: -1,
            transform: "scale(1.1)",
          }}
        />
      ) : (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "linear-gradient(180deg,#0b0b12 0%, #08080f 45%, #07070d 100%)",
            zIndex: -1,
          }}
        />
      )}

      <button
        type="button"
        onClick={() => router.push("/music")}
        className="mb-8 inline-flex items-center gap-2 text-[13px] text-[#A0A8C0] transition-colors hover:text-white"
      >
        <ArrowLeft size={15} />
        Back to Music
      </button>

      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-10 lg:flex-row">
        <div className="w-full shrink-0 lg:w-[320px]">
          {cover ? (
            <Image
              src={cover}
              alt={music.title}
              width={320}
              height={320}
              unoptimized
              style={{ borderRadius: 16, objectFit: "cover", boxShadow: "0 32px 80px rgba(0,0,0,0.60)" }}
            />
          ) : (
            <div
              className="flex h-[320px] w-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white/5"
              style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.60)" }}
            >
              <Music2 size={38} color="rgba(255,255,255,0.35)" />
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <span
              className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest"
              style={{ color: typeColor, borderColor: `${typeColor}4d`, background: `${typeColor}14` }}
            >
              {music.type}
            </span>
            <span className="text-[12px] text-[#A0A8C0]">{music.genre || "Uncategorized"}</span>
          </div>
        </div>

        <div className="flex-1">
          <h1
            className="mb-2 text-white"
            style={{ fontFamily: "Barlow Condensed, Space Grotesk, sans-serif", fontWeight: 800, fontSize: "48px", lineHeight: 1.1, letterSpacing: "-0.02em" }}
          >
            {music.title}
          </h1>
          <div className="mb-1 flex items-center gap-2 text-[14px] text-[#A0A8C0]">
            <span className="material-symbols-outlined text-[16px] text-[#5A6080]">person</span>
            By Page KillerCutz
          </div>
          <div className="mb-6 flex items-center gap-2 text-[13px] text-[#5A6080]">
            <CalendarDays size={14} />
            {formatReleaseDate(music.release_date)}
          </div>

          {music.description ? (
            <p className="mb-6 max-w-[480px] text-[14px] leading-7 text-[#A0A8C0]">{music.description}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isThisPlaying) {
                  togglePlay();
                  return;
                }
                void setTrack({
                  id: music.id,
                  title: music.title,
                  artist: "Page KillerCutz",
                  coverUrl: music.cover_url,
                  audioUrl: music.audio_url,
                  type: music.type,
                  releaseType: music.type,
                });
              }}
              className="inline-flex h-14 items-center gap-2 rounded-full px-8 font-headline text-[16px] font-semibold text-black shadow-[0_0_28px_rgba(0,191,255,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "#00BFFF" }}
            >
              {isThisPlaying ? <span className="material-symbols-outlined text-[20px]">pause</span> : <Play size={18} fill="#000" />}
              {isThisPlaying ? "Pause" : "Play Now"}
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="inline-flex h-14 items-center gap-2 rounded-full border border-white/15 px-5 text-white transition-colors hover:bg-white/5"
            >
              <Share2 size={16} />
              Share
              <Copy size={14} />
            </button>
          </div>

          <div className="mb-8 mt-6 flex flex-wrap gap-3">
            {tracks.length > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[12px] text-[#5A6080]">
                <Music size={13} />
                {tracks.length} tracks
              </div>
            ) : null}
            {music.duration ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[12px] text-[#5A6080]">
                <Clock3 size={13} />
                {formatDuration(music.duration)}
              </div>
            ) : null}
          </div>

          {music.type === "album" && tracks.length > 0 ? (
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#5A6080]">TRACKLIST</p>
              <div>
                {tracks.map((track, i) => (
                  <div key={`${track.title}-${i}`} className="flex items-center gap-4 border-b border-white/10 py-3">
                    <span className="w-7 font-mono text-[12px] text-[#5A6080]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 font-headline text-[14px] text-white">{track.title}</span>
                    <span className="font-mono text-[12px] text-[#5A6080]">{formatDuration(track.duration)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        void setTrack({
                          id: `${music.id}-${i}`,
                          musicId: music.id,
                          title: track.title,
                          artist: "Page KillerCutz",
                          coverUrl: music.cover_url,
                          audioUrl: track.audio_url ?? music.audio_url,
                          type: music.type,
                          releaseType: music.type,
                          duration: track.duration ?? undefined,
                          durationSec: track.duration ?? undefined,
                        })
                      }
                      className="text-white/40 transition-colors hover:text-[#00BFFF]"
                      aria-label={`Play ${track.title}`}
                    >
                      <Play size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
