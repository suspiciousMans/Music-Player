import { useEffect, useRef } from "react";
import type { Track } from "@music-player/core";
import { usePlayerEngine } from "./hooks/usePlayerEngine";
import { useTheme } from "./hooks/useTheme";
import { PlayerBar } from "./components/PlayerBar";
import { Library } from "./components/Library";
import { AddSourceMenu } from "./components/AddSourceMenu";
import { NotificationToast } from "./components/NotificationToast";
import { CustomizePanel } from "./components/CustomizePanel";
import { ReactiveBackground } from "./components/ReactiveBackground";

export function App() {
  const { engine, state, queue, notification, dismissNotification } = usePlayerEngine();
  const { theme, update: updateTheme } = useTheme();
  const hydrated = useRef(false);

  // Load the persisted library once on startup.
  useEffect(() => {
    void window.musicPlayerAPI.loadLibrary().then((tracks) => {
      engine.load(tracks, 0);
      hydrated.current = true;
    });
  }, [engine]);

  function persist(tracks: Track[]) {
    void window.musicPlayerAPI.saveLibrary(tracks);
  }

  function addTracks(newTracks: Track[]) {
    const existingIds = new Set(queue.map((t) => t.id));
    const merged = [...queue, ...newTracks.filter((t) => !existingIds.has(t.id))];
    const keepIndex = state.track ? merged.findIndex((t) => t.id === state.track!.id) : 0;
    engine.load(merged, Math.max(keepIndex, 0));
    persist(merged);
  }

  function removeTrack(index: number) {
    const removedId = queue[index]?.id;
    const remaining = queue.filter((_, i) => i !== index);
    const keepIndex = state.track && state.track.id !== removedId ? remaining.findIndex((t) => t.id === state.track!.id) : 0;
    engine.load(remaining, Math.max(keepIndex, 0));
    persist(remaining);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Music Player</h1>
        <div className="app-header-actions">
          <CustomizePanel theme={theme} onChange={updateTheme} />
          <AddSourceMenu onAdd={addTracks} />
        </div>
      </header>

      <main className="app-main">
        <ReactiveBackground engine={engine} isPlaying={state.isPlaying} theme={theme} />
        <Library
          tracks={queue}
          currentIndex={state.index}
          isPlaying={state.isPlaying}
          onPlay={(index) => engine.playAt(index)}
          onRemove={removeTrack}
        />
      </main>

      <PlayerBar engine={engine} state={state} theme={theme} />

      <div className="toast-region">
        {notification && (
          <NotificationToast
            key={notification.key}
            track={notification.track}
            eventKey={notification.key}
            onDismiss={dismissNotification}
          />
        )}
      </div>
    </div>
  );
}
