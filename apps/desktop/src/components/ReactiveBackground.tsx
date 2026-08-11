import { useEffect, useRef } from "react";
import { ReactiveVisualizer, type PlayerEngine } from "@music-player/core";
import type { ThemeConfig } from "../hooks/useTheme";

interface Props {
  engine: PlayerEngine;
  isPlaying: boolean;
  theme: ThemeConfig;
}

export function ReactiveBackground({ engine, isPlaying, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<ReactiveVisualizer | null>(null);

  useEffect(() => {
    if (theme.background !== "reactive") return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const analyser = engine.getAnalyser();
    if (!analyser) return undefined;

    const viz = new ReactiveVisualizer(canvas, analyser, {
      style: theme.visualizer === "off" ? "pulse" : theme.visualizer,
      color: theme.accent,
    });
    visualizerRef.current = viz;
    if (isPlaying) viz.start();
    return () => {
      viz.destroy();
      visualizerRef.current = null;
    };
    // Re-created only when switching into/out of the reactive background;
    // color/style/play-state are pushed to the running instance below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, theme.background]);

  useEffect(() => {
    visualizerRef.current?.setColor(theme.accent);
  }, [theme.accent]);

  useEffect(() => {
    visualizerRef.current?.setStyle(theme.visualizer === "off" ? "pulse" : theme.visualizer);
  }, [theme.visualizer]);

  useEffect(() => {
    if (isPlaying) visualizerRef.current?.start();
    else visualizerRef.current?.stop();
  }, [isPlaying]);

  if (theme.background === "none") {
    return <div className="bg-layer bg-layer-none" />;
  }

  if (theme.background === "image") {
    return (
      <div
        className="bg-layer bg-layer-image"
        style={theme.backgroundImage ? { backgroundImage: `url("${theme.backgroundImage}")` } : undefined}
      />
    );
  }

  if (theme.background === "reactive") {
    return (
      <div className="bg-layer bg-layer-reactive">
        <canvas ref={canvasRef} className="bg-canvas" />
      </div>
    );
  }

  return <div className="bg-layer bg-layer-gradient" />;
}
