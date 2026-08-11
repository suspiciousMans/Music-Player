import { useState } from "react";
import type { VisualizerStyle } from "@music-player/core";
import type { BackgroundStyle, ThemeConfig, ThemeMode } from "../hooks/useTheme";

interface Props {
  theme: ThemeConfig;
  onChange: (patch: Partial<ThemeConfig>) => void;
}

const BACKGROUND_OPTIONS: { value: BackgroundStyle; label: string }[] = [
  { value: "gradient", label: "Ambient gradient" },
  { value: "reactive", label: "Reactive visualizer" },
  { value: "image", label: "Custom image" },
  { value: "none", label: "Solid" },
];

const VISUALIZER_OPTIONS: { value: VisualizerStyle; label: string }[] = [
  { value: "bars", label: "Bars" },
  { value: "wave", label: "Wave" },
  { value: "pulse", label: "Pulse" },
  { value: "off", label: "Off" },
];

export function CustomizePanel({ theme, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="customize">
      <button className="btn" onClick={() => setOpen((v) => !v)} title="Customize appearance">
        🎨 Customize
      </button>
      {open && (
        <div className="customize-panel">
          <div className="customize-row">
            <span className="customize-label">Theme</span>
            <div className="segmented">
              {(["dark", "light"] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`segmented-btn ${theme.mode === mode ? "segmented-btn-active" : ""}`}
                  onClick={() => onChange({ mode })}
                >
                  {mode === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>

          <div className="customize-row">
            <span className="customize-label">Accent color</span>
            <input type="color" value={theme.accent} onChange={(e) => onChange({ accent: e.target.value })} />
          </div>

          <div className="customize-row">
            <span className="customize-label">Background</span>
            <select value={theme.background} onChange={(e) => onChange({ background: e.target.value as BackgroundStyle })}>
              {BACKGROUND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {theme.background === "image" && (
            <div className="customize-row customize-row-stack">
              <span className="customize-label">Image URL</span>
              <input
                type="url"
                placeholder="https://example.com/background.jpg"
                value={theme.backgroundImage}
                onChange={(e) => onChange({ backgroundImage: e.target.value })}
              />
            </div>
          )}

          <div className="customize-row">
            <span className="customize-label">Visualizer</span>
            <select value={theme.visualizer} onChange={(e) => onChange({ visualizer: e.target.value as VisualizerStyle })}>
              {VISUALIZER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
