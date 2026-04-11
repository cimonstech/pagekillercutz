"use client";

import { useEffect, useRef } from "react";
import { registerPlayerAudio } from "@/lib/player-audio-bridge";
import { usePlayerStore } from "@/lib/store/playerStore";

/** HTML5 audio + simulated progress when no file URL. */
export default function PlayerAudioEngine() {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isSimulated = usePlayerStore((s) => s.isSimulated);
  const pause = usePlayerStore((s) => s.pause);
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
      void audio.play().catch(() => pause());
    } else {
      audio.pause();
    }
  }, [current?.audioUrl, current?.title, isPlaying, volume, pause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl || isSimulated) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      pause();
      setCurrentTime(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [current?.audioUrl, isSimulated, pause, setCurrentTime]);

  useEffect(() => {
    if (!isSimulated || !isPlaying || !current) return;
    const tick = () => {
      const t = usePlayerStore.getState().currentTime + 0.2;
      if (t >= current.durationSec) {
        pause();
        setCurrentTime(current.durationSec);
        return;
      }
      setCurrentTime(t);
    };
    const id = window.setInterval(tick, 200);
    return () => clearInterval(id);
  }, [isSimulated, isPlaying, current, pause, setCurrentTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl || isSimulated) return;
    audio.volume = volume;
  }, [volume, current?.audioUrl, isSimulated]);

  useEffect(() => {
    if (!current?.audioUrl) {
      registerPlayerAudio(null);
    }
  }, [current?.audioUrl]);

  if (!current) return null;

  if (!current.audioUrl) return null;

  return <audio ref={setAudioRef} className="hidden" preload="metadata" data-player-audio />;
}
