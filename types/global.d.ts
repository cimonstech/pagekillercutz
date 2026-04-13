import type { RefObject } from "react";

declare global {
  interface Window {
    __audioRef?: RefObject<HTMLAudioElement | null>;
  }
}

export {};
