import { contextBridge, ipcRenderer } from "electron";
import type { Track } from "@music-player/core";

const musicPlayerAPI = {
  openFiles: (): Promise<Track[]> => ipcRenderer.invoke("library:openFiles"),
  openFolder: (): Promise<Track[]> => ipcRenderer.invoke("library:openFolder"),
  openPlaylist: (): Promise<Track[]> => ipcRenderer.invoke("library:openPlaylist"),
  loadLibrary: (): Promise<Track[]> => ipcRenderer.invoke("library:load"),
  saveLibrary: (tracks: Track[]): Promise<void> => ipcRenderer.invoke("library:save", tracks),
};

contextBridge.exposeInMainWorld("musicPlayerAPI", musicPlayerAPI);

export type MusicPlayerAPI = typeof musicPlayerAPI;
