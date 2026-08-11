export interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  /** Playable URL: http(s), blob:, or file:// depending on host environment. */
  src: string;
  /** Artwork URL shown in the player UI and notification toast. */
  artwork?: string;
  /** Duration in seconds, if known ahead of time. */
  duration?: number;
}

export type RepeatMode = "off" | "all" | "one";

export interface PlayerState {
  track: Track | null;
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

export interface PlayerEventMap {
  trackchange: { track: Track | null; index: number };
  play: void;
  pause: void;
  ended: void;
  timeupdate: { currentTime: number; duration: number };
  volumechange: { volume: number; muted: boolean };
  queuechange: { tracks: Track[] };
  error: { message: string; track: Track | null };
}
