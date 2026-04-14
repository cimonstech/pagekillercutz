import { create } from "zustand";

export type PlayerTrack = {
  id: string;
  /** Canonical `music` row id for analytics (play_events.music_id). */
  musicId?: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string | null;
  type?: string;
  duration?: number;
  durationSec?: number;
  /** album | single | mix — forwarded to play tracking. */
  releaseType?: string;
};

type PlayerState = {
  currentTrack: PlayerTrack | null;
  /** Back-compat alias used in existing components. */
  current: PlayerTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  /** Back-compat alias used in existing components. */
  currentTime: number;
  volume: number;
  isVisible: boolean;
  /** When true on desktop: floating mini player. On mobile: compact bottom strip (see BottomPlayerBar). */
  isMinimized: boolean;
  queue: PlayerTrack[];
  shuffle: boolean;
  setTrack: (track: PlayerTrack) => Promise<void>;
  setMinimized: (minimized: boolean) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (v: number) => void;
  setProgress: (t: number) => void;
  setDuration: (d: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setQueue: (tracks: PlayerTrack[]) => void;
  toggle: () => void;
  seek: (timeSec: number) => void;
  toggleShuffle: () => void;
  setCurrentTime: (t: number) => void;
  stop: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  /** Same track + paused (or ended): resume; otherwise load and play. */
  playOrResume: (track: PlayerTrack) => Promise<void>;
};

function trackDuration(track: PlayerTrack): number {
  return track.durationSec ?? track.duration ?? 0;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  current: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  currentTime: 0,
  volume: 0.85,
  isVisible: false,
  isMinimized: false,
  queue: [],
  shuffle: false,

  setTrack: async (track) => {
    let audioUrl = track.audioUrl;
    /** Deezer is only for discovery-style playback without a catalog row — never replace missing R2 uploads. */
    const allowDeezerPreview = !track.musicId;
    if (!audioUrl && allowDeezerPreview) {
      try {
        const res = await fetch(`/api/music-search?q=${encodeURIComponent(track.title)}&limit=1`);
        const data = (await res.json()) as { results?: Array<{ previewUrl?: string }> };
        const result = data.results?.[0];
        if (result?.previewUrl) {
          audioUrl = result.previewUrl;
          console.log("[player] Using Deezer preview for:", track.title);
        }
      } catch {
        // No preview available
      }
    }
    const nextTrack = { ...track, audioUrl };
    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 768;
    set({
      currentTrack: nextTrack,
      current: nextTrack,
      isPlaying: true,
      isVisible: true,
      progress: 0,
      currentTime: 0,
      duration: trackDuration(nextTrack),
      ...(isMobile ? { isMinimized: true } : {}),
    });
  },

  setMinimized: (minimized) => set({ isMinimized: minimized }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setProgress: (p) => set({ progress: Math.max(0, p), currentTime: Math.max(0, p) }),
  setDuration: (d) => set({ duration: Number.isFinite(d) ? Math.max(0, d) : 0 }),
  setQueue: (tracks) => set({ queue: tracks }),
  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!queue.length || !currentTrack) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const next = queue[idx + 1] || queue[0];
    void get().setTrack(next);
  },
  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (!queue.length || !currentTrack) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[idx - 1] || queue[queue.length - 1];
    void get().setTrack(prev);
  },

  toggle: () => get().togglePlay(),
  seek: (timeSec) => {
    const max = get().duration || trackDuration(get().currentTrack as PlayerTrack);
    const t = Math.max(0, Math.min(max || 0, timeSec));
    set({ progress: t, currentTime: t });
  },
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  setCurrentTime: (t) => get().setProgress(t),
  stop: () =>
    set({
      currentTrack: null,
      current: null,
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
      isVisible: false,
      isMinimized: false,
    }),
  skipNext: () => get().nextTrack(),
  skipPrev: () => get().prevTrack(),

  playOrResume: async (track) => {
    const { currentTrack, isPlaying, setTrack, setIsPlaying, setProgress } = get();
    const same = Boolean(currentTrack && currentTrack.id === track.id);
    if (same) {
      if (!isPlaying) {
        const atEnd = get().progress >= (get().duration || trackDuration(track)) - 0.25;
        if (atEnd) setProgress(0);
        setIsPlaying(true);
      }
      return;
    }
    await setTrack(track);
  },
}));
