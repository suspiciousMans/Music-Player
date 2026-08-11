import { useEffect, useRef } from "react";
import { ReactiveVisualizer, type PlayerEngine } from "@music-player/core";
import type { ThemeConfig } from "../hooks/useTheme";

interface Props {
  engine: PlayerEngine;
  isPlaying: boolean;
  theme: ThemeConfig;
}

/** Small in-bar equalizer next to the now-playing artwork. */
export function MiniVisualizer({ engine, isPlaying, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<ReactiveVisualizer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const analyser = engine.getAnalyser();
    if (!analyser) return undefined;
    const viz = new ReactiveVisualizer(canvas, analyser, { style: theme.visualizer, color: theme.accent });
    visualizerRef.current = viz;
    if (isPlaying) viz.start();
    return () => {
      viz.destroy();
      visualizerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  useEffect(() => {
    visualizerRef.current?.setColor(theme.accent);
    visualizerRef.current?.setStyle(theme.visualizer);
  }, [theme.accent, theme.visualizer]);

  useEffect(() => {
    if (isPlaying) visualizerRef.current?.start();
    else visualizerRef.current?.stop();
  }, [isPlaying]);

  if (theme.visualizer === "off") return null;
  return <canvas ref={canvasRef} className="mini-visualizer" />;
}
