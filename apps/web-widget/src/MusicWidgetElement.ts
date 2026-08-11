import { PlayerEngine, type Track } from "@music-player/core";
import { WIDGET_STYLES } from "./styles.js";

type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";
const VALID_POSITIONS: Position[] = ["bottom-right", "bottom-left", "top-right", "top-left"];
const TOAST_VISIBLE_MS = 4500;

function isValidPlaylist(data: unknown): data is Track[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Track).id === "string" &&
        typeof (item as Track).title === "string" &&
        typeof (item as Track).src === "string",
    )
  );
}

/**
 * `<music-widget>` — an embeddable, self-contained player for a fixed,
 * developer-supplied playlist. Unlike the desktop app, visitors cannot add
 * or reorder tracks; the site owner controls the queue via the playlist
 * JSON referenced by `playlist-src`.
 */
export class MusicWidgetElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["playlist-src", "position", "accent"];
  }

  private root: ShadowRoot;
  private engine = new PlayerEngine();
  private unsubscribers: Array<() => void> = [];
  private seenFirstTrackChange = false;
  private toastTimers: number[] = [];

  private dockEl!: HTMLDivElement;
  private toastSlotEl!: HTMLDivElement;
  private artEl!: HTMLDivElement;
  private titleEl!: HTMLDivElement;
  private artistEl!: HTMLDivElement;
  private toggleBtn!: HTMLButtonElement;
  private progressFillEl!: HTMLDivElement;
  private progressTrackEl!: HTMLDivElement;
  private hintEl!: HTMLDivElement;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.render();
    this.bindEngineEvents();
    void this.loadPlaylist();
  }

  disconnectedCallback(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.toastTimers.forEach((t) => window.clearTimeout(t));
    this.engine.destroy();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    if (name === "position" && this.dockEl) {
      this.dockEl.dataset.position = this.getPosition();
    }
    if (name === "accent" && this.root.host) {
      (this as HTMLElement).style.setProperty("--mp-accent", newValue || "#6c5ce7");
    }
    if (name === "playlist-src" && this.dockEl) {
      void this.loadPlaylist();
    }
  }

  private getPosition(): Position {
    const value = this.getAttribute("position") as Position | null;
    return value && VALID_POSITIONS.includes(value) ? value : "bottom-right";
  }

  private render(): void {
    const style = document.createElement("style");
    style.textContent = WIDGET_STYLES;

    const dock = document.createElement("div");
    dock.className = "dock";
    dock.dataset.position = this.getPosition();

    const toastSlot = document.createElement("div");
    toastSlot.id = "toast-slot";
    dock.appendChild(toastSlot);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="badge">Now playing</div>
      <div class="card-row">
        <div class="art-placeholder" id="art">&#9834;</div>
        <div class="meta">
          <div class="title" id="title">Loading playlist&hellip;</div>
          <div class="artist" id="artist"></div>
        </div>
        <div class="buttons">
          <button class="icon" data-action="prev" title="Previous">&#9198;</button>
          <button class="icon" data-action="toggle" title="Play">&#9654;</button>
          <button class="icon" data-action="next" title="Next">&#9197;</button>
        </div>
      </div>
      <div class="progress-track" id="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
      <div class="hint" id="hint"></div>
    `;
    dock.appendChild(card);

    this.root.replaceChildren(style, dock);

    this.dockEl = dock;
    this.toastSlotEl = toastSlot;
    this.artEl = card.querySelector("#art")!;
    this.titleEl = card.querySelector("#title")!;
    this.artistEl = card.querySelector("#artist")!;
    this.toggleBtn = card.querySelector('[data-action="toggle"]')!;
    this.progressFillEl = card.querySelector("#progress-fill")!;
    this.progressTrackEl = card.querySelector("#progress-track")!;
    this.hintEl = card.querySelector("#hint")!;

    const accent = this.getAttribute("accent");
    if (accent) this.style.setProperty("--mp-accent", accent);

    card.querySelector('[data-action="toggle"]')!.addEventListener("click", () => this.engine.toggle());
    card.querySelector('[data-action="next"]')!.addEventListener("click", () => this.engine.next());
    card.querySelector('[data-action="prev"]')!.addEventListener("click", () => this.engine.previous());
    this.progressTrackEl.addEventListener("click", (event) => {
      const rect = this.progressTrackEl.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      const duration = this.engine.getState().duration;
      if (duration > 0) this.engine.seek(ratio * duration);
    });
  }

  private async loadPlaylist(): Promise<void> {
    const src = this.getAttribute("playlist-src");
    if (!src) {
      this.titleEl.textContent = "Missing playlist-src attribute";
      return;
    }
    try {
      const resolved = new URL(src, document.baseURI).toString();
      const response = await fetch(resolved);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as unknown;
      if (!isValidPlaylist(data)) throw new Error("Playlist JSON must be an array of {id, title, src}");
      this.engine.load(data, 0);
      this.hintEl.textContent = data.length === 0 ? "Playlist is empty" : "";
    } catch (err) {
      this.titleEl.textContent = "Couldn't load playlist";
      this.hintEl.textContent = err instanceof Error ? err.message : String(err);
    }
  }

  private bindEngineEvents(): void {
    this.unsubscribers.push(
      this.engine.on("trackchange", ({ track }) => {
        this.updateNowPlaying(track);
        if (track && this.seenFirstTrackChange) this.showToast(track);
        this.seenFirstTrackChange = true;
      }),
      this.engine.on("play", () => {
        this.toggleBtn.innerHTML = "&#9208;";
        this.toggleBtn.title = "Pause";
      }),
      this.engine.on("pause", () => {
        this.toggleBtn.innerHTML = "&#9654;";
        this.toggleBtn.title = "Play";
      }),
      this.engine.on("timeupdate", ({ currentTime, duration }) => {
        const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
        this.progressFillEl.style.width = `${pct}%`;
      }),
      this.engine.on("error", ({ message }) => {
        this.hintEl.textContent = message;
      }),
    );
  }

  private buildArtEl(artwork: string | undefined, className: string): HTMLElement {
    if (artwork) {
      const img = document.createElement("img");
      img.className = className;
      img.src = artwork;
      img.alt = "";
      return img;
    }
    const placeholder = document.createElement("div");
    placeholder.className = `${className === "art" ? "art-placeholder" : className}`;
    placeholder.textContent = "♪";
    return placeholder;
  }

  private updateNowPlaying(track: Track | null): void {
    this.titleEl.textContent = track?.title ?? "Nothing queued";
    this.artistEl.textContent = track?.artist ?? "";
    const newArt = this.buildArtEl(track?.artwork, "art");
    newArt.id = "art";
    this.artEl.replaceWith(newArt);
    this.artEl = newArt as HTMLDivElement;
  }

  private showToast(track: Track): void {
    this.toastTimers.forEach((t) => window.clearTimeout(t));
    this.toastTimers = [];

    const toast = document.createElement("div");
    toast.className = "toast toast-entering";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    toast.appendChild(this.buildArtEl(track.artwork, "art"));

    const meta = document.createElement("div");
    meta.className = "meta";

    const eyebrow = document.createElement("div");
    eyebrow.className = "toast-eyebrow";
    eyebrow.textContent = "Now playing";
    meta.appendChild(eyebrow);

    const title = document.createElement("div");
    title.className = "toast-title";
    title.textContent = track.title;
    meta.appendChild(title);

    if (track.artist) {
      const artist = document.createElement("div");
      artist.className = "toast-artist";
      artist.textContent = track.artist;
      meta.appendChild(artist);
    }

    toast.appendChild(meta);
    this.toastSlotEl.replaceChildren(toast);

    this.toastTimers.push(
      window.setTimeout(() => toast.classList.replace("toast-entering", "toast-leaving"), TOAST_VISIBLE_MS),
      window.setTimeout(() => toast.remove(), TOAST_VISIBLE_MS + 400),
    );
  }
}
