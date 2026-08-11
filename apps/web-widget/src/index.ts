import { MusicWidgetElement } from "./MusicWidgetElement.js";

export { MusicWidgetElement };
export type { Track, PlayerState, RepeatMode } from "@music-player/core";

if (!customElements.get("music-widget")) {
  customElements.define("music-widget", MusicWidgetElement);
}

/**
 * Zero-markup embed: <script src="music-widget.js" data-playlist="/playlist.json"></script>
 * If the including script tag carries a data-playlist attribute and the page
 * hasn't placed a <music-widget> element itself, mount one automatically.
 *
 * document.currentScript is only valid during synchronous execution of this
 * script, so it must be captured now, before deferring to DOMContentLoaded.
 */
const embeddingScript = document.currentScript as HTMLScriptElement | null;

function autoMount(script: HTMLScriptElement | null): void {
  const playlistSrc = script?.dataset.playlist;
  if (!playlistSrc) return;
  if (document.querySelector("music-widget")) return;

  const el = document.createElement("music-widget");
  el.setAttribute("playlist-src", playlistSrc);
  if (script?.dataset.position) el.setAttribute("position", script.dataset.position);
  if (script?.dataset.accent) el.setAttribute("accent", script.dataset.accent);
  document.body.appendChild(el);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => autoMount(embeddingScript));
} else {
  autoMount(embeddingScript);
}
