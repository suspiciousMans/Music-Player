---
name: run-desktop
description: Build, run, and drive the Music Player Electron desktop app. Use when asked to start the desktop app, take a screenshot of it, build it, or interact with its UI.
---

Music Player's desktop app is Electron + React (Vite renderer). For agent/automated
use, drive it via the Playwright REPL at `.claude/skills/run-desktop/driver.mjs`
under xvfb — there is no display to view an Electron window directly in this
container.

All paths are relative to `apps/desktop/`.

## Prerequisites

```bash
apt-get install -y xvfb libnss3 libgbm1 libasound2t64 libgtk-3-0 \
  libxss1 libxkbcommon0 libatk-bridge2.0-0 libcups2 libdrm2
```

## Build

```bash
cd /path/to/repo
npm install
npm run build:core       # shared packages/player-core
npm run build -w apps/desktop   # renderer (dist/) + main/preload (dist-electron/)
```

The driver launches the **production build** (`dist/index.html`), not the Vite
dev server — no need to keep a dev server alive for automated checks.

## Run (agent path)

```bash
cd apps/desktop
xvfb-run -a --server-args="-screen 0 1280x800x24" node .claude/skills/run-desktop/driver.mjs
```

Wrap in tmux for interactive use:

```bash
tmux new-session -d -s app -x 200 -y 50
tmux send-keys -t app 'cd apps/desktop && xvfb-run -a --server-args="-screen 0 1280x800x24" node .claude/skills/run-desktop/driver.mjs' Enter
timeout 20 bash -c 'until tmux capture-pane -t app -p | grep -q "driver>"; do sleep 0.2; done'
tmux send-keys -t app 'launch' Enter
timeout 60 bash -c 'until tmux capture-pane -t app -p | grep -q "launched"; do sleep 0.5; done'
tmux send-keys -t app 'ss landing' Enter
tmux capture-pane -t app -p
```

Screenshots land in `/tmp/shots/` (override: `SCREENSHOT_DIR`).

### Commands

| command | what it does |
|---|---|
| `launch` | launch the app, wait for windows |
| `ss [name]` | screenshot → `/tmp/shots/<name>.png` |
| `click <css-sel>` | click element (via DOM, not coords) |
| `click-text <text>` | click button/link containing text |
| `type <text>` / `press <key>` | keyboard input |
| `wait <css-sel>` | wait for element, 10s timeout |
| `eval <js>` | evaluate in the page, print JSON |
| `text [css-sel]` | print innerText |
| `windows` | list all windows |
| `add-stream <url>` | add a track via "+ Add music" → stream URL (native file/folder dialogs can't be driven by Playwright) |
| `quit` | close app, exit |

## Run (human path)

```bash
npm run dev:desktop   # Vite HMR + Electron window; useless in a display-less container
```

## Gotchas

- **Electron refuses to run as root without `--no-sandbox`.** `npm run dev:desktop`
  sets `ELECTRON_DISABLE_SANDBOX=true` on the `dev:electron` script specifically to
  handle this (root containers/CI only — has no effect on the packaged production
  app, which uses a separate `build`/`package` script). The driver instead passes
  `--no-sandbox` directly to `electron.launch()`.
- **File/folder/M3U import dialogs are native OS dialogs** — Playwright can't drive
  them. Use the driver's `add-stream <url>` command to get a track into the queue
  for testing instead.
- **npm workspaces hoists `electron` to the monorepo root** `node_modules/`, not
  `apps/desktop/node_modules/`. The driver resolves the binary from
  `../../../../node_modules/electron` (`APP_DIR/../..`), not `APP_DIR`.
- **dbus / GPU / cert-verify errors in the log are noise**, not app bugs — expected
  from headless Chromium in a sandboxed container with no display bus or GPU and a
  proxied network. Ignore lines like `Failed to connect to the bus` and
  `CertVerifyProcBuiltin ... failed` unless the app itself is failing to render.

## Troubleshooting

- **Launch timeout (30s):** build output missing? → re-run the build step.
- **"Missing X server":** forgot `xvfb-run`. Headless Linux needs it.
- **Stale Xvfb locks:** `rm -f /tmp/.X*-lock; pkill Xvfb`
