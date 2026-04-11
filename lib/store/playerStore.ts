import { create } from "zustand";

export type PlayerTrack = {
  id?: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string | null;
  durationSec: number;
};

type PlayerState = {
  current: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  shuffle: boolean;
  /** True while using simulated progress (no audio file). */
  isSimulated: boolean;
  loadTrack: (track: PlayerTrack) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (timeSec: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  setCurrentTime: (t: number) => void;
  stop: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  /** Same track + paused (or ended): resume; otherwise load and play. */
  playOrResume: (track: PlayerTrack) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  current: null,
  isPlaying: false,
  currentTime: 0,
  volume: 0.85,
  shuffle: false,
  isSimulated: false,

  loadTrack: (track) => {
    set({
      current: track,
      currentTime: 0,
      isPlaying: true,
      isSimulated: !track.audioUrl,
    });
  },

  play: () => {
    if (!get().current) return;
    set({ isPlaying: true });
  },

  pause: () => set({ isPlaying: false }),

  toggle: () => {
    if (!get().current) return;
    set((s) => ({ isPlaying: !s.isPlaying }));
  },

  seek: (timeSec) => {
    const { current } = get();
    if (!current) return;
    const t = Math.max(0, Math.min(current.durationSec, timeSec));
    set({ currentTime: t });
  },

  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  setCurrentTime: (t) => {
    const { current } = get();
    if (!current) return;
    set({ currentTime: Math.max(0, Math.min(current.durationSec, t)) });
  },

  stop: () =>
    set({
      current: null,
      isPlaying: false,
      currentTime: 0,
      isSimulated: false,
    }),

  skipNext: () => get().stop(),
  skipPrev: () => {
    const { current } = get();
    if (!current) return;
    set({ currentTime: 0 });
  },

  playOrResume: (track) => {
    const { current, isPlaying, loadTrack, play, seek } = get();
    const same =
      current &&
      (Boolean(track.id && current.id === track.id) ||
        (!track.id &&
          current.title === track.title &&
          current.artist === track.artist &&
          (current.audioUrl ?? "") === (track.audioUrl ?? "") &&
          current.coverUrl === track.coverUrl));
    if (same) {
      if (!isPlaying) {
        const atEnd = get().currentTime >= current.durationSec - 0.25;
        if (atEnd) seek(0);
        play();
      }
      return;
    }
    loadTrack(track);
  },
}));
