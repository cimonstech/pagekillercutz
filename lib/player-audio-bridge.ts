let playerAudio: HTMLAudioElement | null = null;

export function registerPlayerAudio(el: HTMLAudioElement | null) {
  playerAudio = el;
}

export function setPlayerAudioTime(sec: number) {
  if (playerAudio && Number.isFinite(sec)) {
    try {
      playerAudio.currentTime = sec;
    } catch {
      /* ignore */
    }
  }
}
