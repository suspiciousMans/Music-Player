# Music Player

A shared playback engine with two front ends:

- **`apps/desktop`** — an Electron + React desktop app. Import your own music from local files, whole folders, M3U playlists, or a stream URL, and build a personal library.
- **`apps/web-widget`** — a dependency-free embeddable widget (`<music-widget>`) for any website. It plays a fixed playlist defined by the site owner; visitors can play/pause/skip but not change the queue.

Both surfaces are driven by the same **`packages/player-core`** engine, so playback behavior — including the slide-out "now playing" notification whenever the track changes — is identical everywhere.

## Project layout

```
packages/player-core   framework-agnostic playback engine (PlayerEngine, Playlist, types)
apps/desktop            Electron + React desktop app
apps/web-widget         embeddable <music-widget> custom element + demo site
```

## Getting started

```bash
npm install          # installs and links every workspace
npm run build:core   # compiles the shared engine (do this once, or after editing packages/player-core)
```

### Desktop app

```bash
npm run dev:desktop     # launches Vite + Electron with hot reload
npm run build:desktop   # type-checks and builds the renderer + main/preload bundles
npm run package -w apps/desktop   # builds a distributable (AppImage/nsis/dmg via electron-builder)
```

The desktop app lets you add music four ways (via the "+ Add music" menu):

- **Audio files** — pick one or more local files (mp3, wav, ogg, m4a, flac, aac, opus)
- **Folder** — recursively scans a folder for audio files
- **M3U playlist** — imports an `.m3u`/`.m3u8` file, using `#EXTINF` hints for title/artist when present
- **Stream/audio URL** — paste any direct audio URL (e.g. an internet radio stream)

Your library persists to disk (`app.getPath('userData')/library.json`) between launches.

### Web widget

```bash
npm run dev:widget     # Vite dev server serving apps/web-widget/demo
npm run build:widget   # produces apps/web-widget/dist/music-widget.js (+ .esm.js)
```

Embed it on any site with a single script tag:

```html
<script src="/music-widget.js" data-playlist="/playlist.json" data-position="bottom-right"></script>
```

That auto-mounts a `<music-widget>` for you. You can also place the element explicitly for more control:

```html
<script type="module" src="/music-widget.esm.js"></script>
<music-widget playlist-src="/playlist.json" position="bottom-left" accent="#22c55e"></music-widget>
```

**Attributes:** `playlist-src` (required, URL to a playlist JSON file), `position` (`bottom-right` default, `bottom-left`, `top-right`, `top-left`), `accent` (any CSS color).

**Playlist JSON format** — an array of tracks the developer controls (see `apps/web-widget/public/playlist.json` for a working sample using public demo audio):

```json
[
  { "id": "track-1", "title": "Song Title", "artist": "Artist Name", "src": "https://example.com/song.mp3", "artwork": "https://example.com/cover.jpg" }
]
```

Swap in your own hosted audio files before deploying — the bundled sample uses SoundHelix's public demo tracks purely as a placeholder.

## How notifications work

`PlayerEngine` emits a `trackchange` event any time the active track changes (skip, autoplay-to-next, or a manual selection). Both front ends listen for this event and show a small card that slides in from a screen corner, then auto-dismisses a few seconds later (respecting `prefers-reduced-motion`). The very first track load (queue hydration on startup) is suppressed so you don't get a notification before you've interacted with the player.
