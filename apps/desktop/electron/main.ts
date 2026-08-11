import { app, BrowserWindow, dialog, ipcMain } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { Track } from "@music-player/core";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".opus"]);
const LIBRARY_FILE = () => path.join(app.getPath("userData"), "library.json");

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: "#121212",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function titleFromFilename(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

function trackFromFilePath(filePath: string): Track {
  return {
    id: filePath,
    title: titleFromFilename(filePath),
    src: pathToFileURL(filePath).toString(),
  };
}

function scanFolderForAudio(folderPath: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanFolderForAudio(fullPath));
    } else if (AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Parses #EXTINF "Artist - Title" hints out of an M3U/M3U8 playlist. */
function parseM3U(content: string, baseDir: string): Track[] {
  const lines = content.split(/\r?\n/);
  const tracks: Track[] = [];
  let pendingLabel: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#EXTINF:")) {
      const commaIndex = line.indexOf(",");
      pendingLabel = commaIndex !== -1 ? line.slice(commaIndex + 1).trim() : null;
      continue;
    }
    if (line.startsWith("#")) continue;

    const isRemote = /^https?:\/\//i.test(line);
    const resolvedPath = isRemote ? line : path.resolve(baseDir, line);
    let title = pendingLabel ?? titleFromFilename(resolvedPath);
    let artist: string | undefined;
    if (pendingLabel && pendingLabel.includes(" - ")) {
      const [a, ...rest] = pendingLabel.split(" - ");
      artist = a.trim();
      title = rest.join(" - ").trim();
    }
    tracks.push({
      id: resolvedPath,
      title,
      artist,
      src: isRemote ? resolvedPath : pathToFileURL(resolvedPath).toString(),
    });
    pendingLabel = null;
  }
  return tracks;
}

ipcMain.handle("library:openFiles", async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Add music files",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Audio", extensions: [...AUDIO_EXTENSIONS].map((ext) => ext.slice(1)) }],
  });
  if (result.canceled) return [];
  return result.filePaths.map(trackFromFilePath);
});

ipcMain.handle("library:openFolder", async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Add a music folder",
    properties: ["openDirectory"],
  });
  if (result.canceled) return [];
  const files = scanFolderForAudio(result.filePaths[0]);
  return files.map(trackFromFilePath);
});

ipcMain.handle("library:openPlaylist", async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Import a playlist",
    properties: ["openFile"],
    filters: [{ name: "Playlists", extensions: ["m3u", "m3u8"] }],
  });
  if (result.canceled) return [];
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, "utf-8");
  return parseM3U(content, path.dirname(filePath));
});

ipcMain.handle("library:load", async () => {
  try {
    const content = fs.readFileSync(LIBRARY_FILE(), "utf-8");
    return JSON.parse(content) as Track[];
  } catch {
    return [];
  }
});

ipcMain.handle("library:save", async (_event, tracks: Track[]) => {
  fs.mkdirSync(path.dirname(LIBRARY_FILE()), { recursive: true });
  fs.writeFileSync(LIBRARY_FILE(), JSON.stringify(tracks, null, 2), "utf-8");
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
