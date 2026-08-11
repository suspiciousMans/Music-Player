import type { Track } from "@music-player/core";

declare global {
  interface Window {
    musicPlayerAPI: {
      openFiles(): Promise<Track[]>;
      openFolder(): Promise<Track[]>;
      openPlaylist(): Promise<Track[]>;
      loadLibrary(): Promise<Track[]>;
      saveLibrary(tracks: Track[]): Promise<void>;
    };
  }
}

export {};
