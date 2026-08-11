import { useEffect, useState } from "react";
import type { VisualizerStyle } from "@music-player/core";

export type ThemeMode = "dark" | "light";
export type BackgroundStyle = "none" | "gradient" | "reactive" | "image";

export interface ThemeConfig {
  mode: ThemeMode;
  accent: string;
  background: BackgroundStyle;
  backgroundImage: string;
  visualizer: VisualizerStyle;
}

export const DEFAULT_THEME: ThemeConfig = {
  mode: "dark",
  accent: "#6c5ce7",
  background: "gradient",
  backgroundImage: "",
  visualizer: "bars",
};

const STORAGE_KEY = "music-player:theme";

function loadStoredTheme(): ThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...(JSON.parse(raw) as Partial<ThemeConfig>) };
  } catch {
    return DEFAULT_THEME;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeConfig>(loadStoredTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    document.documentElement.dataset.theme = theme.mode;
    document.documentElement.style.setProperty("--accent", theme.accent);
  }, [theme]);

  function update(patch: Partial<ThemeConfig>): void {
    setTheme((prev) => ({ ...prev, ...patch }));
  }

  return { theme, update };
}
