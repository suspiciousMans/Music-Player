import type { RepeatMode, Track } from "./types.js";

/**
 * Pure queue/ordering logic, kept separate from playback so it can be
 * unit-tested without touching an <audio> element.
 */
export class Playlist {
  private tracks: Track[] = [];
  private order: number[] = [];
  private cursor = -1;
  shuffle = false;
  repeat: RepeatMode = "off";

  setTracks(tracks: Track[]): void {
    this.tracks = tracks;
    this.rebuildOrder();
    this.cursor = tracks.length > 0 ? 0 : -1;
  }

  getTracks(): Track[] {
    return this.tracks;
  }

  get length(): number {
    return this.tracks.length;
  }

  get currentIndex(): number {
    return this.cursor === -1 ? -1 : this.order[this.cursor];
  }

  get currentTrack(): Track | null {
    const idx = this.currentIndex;
    return idx === -1 ? null : this.tracks[idx] ?? null;
  }

  setShuffle(enabled: boolean): void {
    if (this.shuffle === enabled) return;
    const currentTrackIndex = this.currentIndex;
    this.shuffle = enabled;
    this.rebuildOrder(currentTrackIndex);
  }

  setRepeat(mode: RepeatMode): void {
    this.repeat = mode;
  }

  jumpTo(trackIndex: number): boolean {
    const positionInOrder = this.order.indexOf(trackIndex);
    if (positionInOrder === -1) return false;
    this.cursor = positionInOrder;
    return true;
  }

  /** Advances the cursor. Returns null when playback should stop (end of queue, no repeat). */
  next(explicit = false): Track | null {
    if (this.tracks.length === 0) return null;

    if (!explicit && this.repeat === "one") {
      return this.currentTrack;
    }

    if (this.cursor + 1 < this.order.length) {
      this.cursor += 1;
      return this.currentTrack;
    }

    if (this.repeat === "all" || explicit) {
      if (this.shuffle) this.rebuildOrder();
      this.cursor = this.order.length > 0 ? 0 : -1;
      return this.currentTrack;
    }

    return null;
  }

  previous(): Track | null {
    if (this.tracks.length === 0) return null;
    if (this.cursor > 0) {
      this.cursor -= 1;
      return this.currentTrack;
    }
    if (this.repeat === "all") {
      this.cursor = this.order.length - 1;
      return this.currentTrack;
    }
    return this.currentTrack;
  }

  private rebuildOrder(keepTrackIndex = -1): void {
    const indices = this.tracks.map((_, i) => i);
    if (this.shuffle) {
      for (let i = indices.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
    }
    this.order = indices;
    if (keepTrackIndex !== -1) {
      const pos = this.order.indexOf(keepTrackIndex);
      this.cursor = pos === -1 ? 0 : pos;
    }
  }
}
