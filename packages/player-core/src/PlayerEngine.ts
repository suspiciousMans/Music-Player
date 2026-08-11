import { TypedEventEmitter } from "./EventEmitter.js";
import { Playlist } from "./Playlist.js";
import type { PlayerEventMap, PlayerState, RepeatMode, Track } from "./types.js";

/**
 * Framework-agnostic playback engine built on the native HTMLAudioElement.
 * Both the Electron desktop app and the browser widget drive playback
 * through this same class so track-change/notification behavior stays
 * identical across surfaces.
 */
export class PlayerEngine extends TypedEventEmitter<PlayerEventMap> {
  private audio: HTMLAudioElement;
  private playlist = new Playlist();
  private wantsPlaying = false;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;

  constructor() {
    super();
    this.audio = new Audio();
    this.audio.preload = "metadata";
    // Best-effort: lets the analyser read frequency data from CORS-enabled
    // cross-origin sources (most audio CDNs). Sources without CORS headers
    // still play fine — getAnalyser() just won't see meaningful data for them.
    this.audio.crossOrigin = "anonymous";
    this.bindAudioEvents();
  }

  private bindAudioEvents(): void {
    this.audio.addEventListener("play", () => this.emit("play", undefined));
    this.audio.addEventListener("pause", () => this.emit("pause", undefined));
    this.audio.addEventListener("timeupdate", () => {
      this.emit("timeupdate", {
        currentTime: this.audio.currentTime,
        duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
      });
    });
    this.audio.addEventListener("volumechange", () => {
      this.emit("volumechange", { volume: this.audio.volume, muted: this.audio.muted });
    });
    this.audio.addEventListener("ended", () => {
      this.emit("ended", undefined);
      this.advance(false);
    });
    this.audio.addEventListener("error", () => {
      this.emit("error", {
        message: this.audio.error?.message ?? "Playback error",
        track: this.playlist.currentTrack,
      });
    });
  }

  /** Replace the queue and start loading (optionally playing) a given index. */
  load(tracks: Track[], startIndex = 0): void {
    this.playlist.setTracks(tracks);
    this.emit("queuechange", { tracks });
    if (tracks.length === 0) {
      this.audio.removeAttribute("src");
      this.emit("trackchange", { track: null, index: -1 });
      return;
    }
    this.playlist.jumpTo(Math.min(Math.max(startIndex, 0), tracks.length - 1));
    this.loadCurrentTrack();
  }

  private loadCurrentTrack(autoplay = this.wantsPlaying): void {
    const track = this.playlist.currentTrack;
    this.emit("trackchange", { track, index: this.playlist.currentIndex });
    if (!track) return;
    this.audio.src = track.src;
    this.audio.load();
    if (autoplay) void this.audio.play().catch(() => undefined);
  }

  play(): void {
    this.wantsPlaying = true;
    if (this.audioContext?.state === "suspended") void this.audioContext.resume();
    void this.audio.play().catch((err) => {
      this.emit("error", { message: String(err), track: this.playlist.currentTrack });
    });
  }

  pause(): void {
    this.wantsPlaying = false;
    this.audio.pause();
  }

  toggle(): void {
    if (this.audio.paused) this.play();
    else this.pause();
  }

  private advance(explicit: boolean): void {
    const track = this.playlist.next(explicit);
    if (!track) {
      this.wantsPlaying = false;
      this.emit("trackchange", { track: null, index: -1 });
      return;
    }
    this.loadCurrentTrack(explicit ? this.wantsPlaying : true);
  }

  next(): void {
    this.advance(true);
  }

  previous(): void {
    // Restart current track if we're more than 3s in, like most players.
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }
    const track = this.playlist.previous();
    if (track) this.loadCurrentTrack(this.wantsPlaying);
  }

  playAt(index: number): void {
    if (!this.playlist.jumpTo(index)) return;
    this.wantsPlaying = true;
    this.loadCurrentTrack(true);
  }

  seek(seconds: number): void {
    this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || seconds));
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  setShuffle(enabled: boolean): void {
    this.playlist.setShuffle(enabled);
  }

  setRepeat(mode: RepeatMode): void {
    this.playlist.setRepeat(mode);
  }

  /**
   * Lazily wires the audio element through a Web Audio AnalyserNode for
   * reactive visualizations. Returns null if Web Audio isn't available
   * (e.g. older environments) rather than throwing — visualizers are a
   * cosmetic layer and should never be able to break playback.
   */
  getAnalyser(): AnalyserNode | null {
    if (this.analyserNode) return this.analyserNode;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new Ctx();
      const source = this.audioContext.createMediaElementSource(this.audio);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;
      source.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
      return this.analyserNode;
    } catch {
      this.audioContext = null;
      this.analyserNode = null;
      return null;
    }
  }

  getState(): PlayerState {
    return {
      track: this.playlist.currentTrack,
      index: this.playlist.currentIndex,
      isPlaying: !this.audio.paused,
      currentTime: this.audio.currentTime,
      duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
      volume: this.audio.volume,
      muted: this.audio.muted,
      shuffle: this.playlist.shuffle,
      repeat: this.playlist.repeat,
    };
  }

  destroy(): void {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    void this.audioContext?.close();
    this.audioContext = null;
    this.analyserNode = null;
  }
}
