"use client";

import { useEffect, useRef } from "react";
import { registerPlayerAudio } from "@/lib/player-audio-bridge";
import { usePlayerStore } from "@/lib/store/playerStore";

/** HTML5 audio + simulated progress when no file URL. */
export default function PlayerAudioEngine() {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const setAudioRef = (el: HTMLAudioElement | null) => {
    audioRef.current = el;
    registerPlayerAudio(el);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;

    if (audio.getAttribute("data-src") !== current.audioUrl) {
      audio.setAttribute("data-src", current.audioUrl);
      audio.src = current.audioUrl;
      audio.load();
    }
    audio.volume = volume;

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [current?.audioUrl, current?.title, isPlaying, volume, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [current?.audioUrl, setIsPlaying, setCurrentTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    audio.volume = volume;
  }, [volume, current?.audioUrl]);

  useEffect(() => {
    if (!current?.audioUrl) {
      registerPlayerAudio(null);
    }
  }, [current?.audioUrl]);

  if (!current) return null;

  if (!current.audioUrl) return null;

  return <audio ref={setAudioRef} className="hidden" preload="metadata" data-player-audio />;
}
