import { useEffect, useMemo, useRef, useState } from "react";
import { PlayerEngine, type PlayerState, type Track } from "@music-player/core";

const initialState: PlayerState = {
  track: null,
  index: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  shuffle: false,
  repeat: "off",
};

export interface NotificationEvent {
  track: Track;
  key: number;
}

export function usePlayerEngine() {
  const engineRef = useRef<PlayerEngine>();
  if (!engineRef.current) engineRef.current = new PlayerEngine();
  const engine = engineRef.current;

  const [state, setState] = useState<PlayerState>(initialState);
  const [queue, setQueue] = useState<Track[]>([]);
  const [notification, setNotification] = useState<NotificationEvent | null>(null);
  const notificationKey = useRef(0);
  const seenFirstTrackChange = useRef(false);

  useEffect(() => {
    const unsubs = [
      engine.on("play", () => setState(engine.getState())),
      engine.on("pause", () => setState(engine.getState())),
      engine.on("timeupdate", () => setState(engine.getState())),
      engine.on("volumechange", () => setState(engine.getState())),
      engine.on("queuechange", ({ tracks }) => setQueue(tracks)),
      engine.on("trackchange", ({ track }) => {
        setState(engine.getState());
        // Skip the toast for the silent initial-library load; only announce
        // changes that happen once the user is actually using the player.
        if (track && seenFirstTrackChange.current) {
          notificationKey.current += 1;
          setNotification({ track, key: notificationKey.current });
        }
        seenFirstTrackChange.current = true;
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [engine]);

  return useMemo(
    () => ({ engine, state, queue, notification, dismissNotification: () => setNotification(null) }),
    [engine, state, queue, notification],
  );
}
