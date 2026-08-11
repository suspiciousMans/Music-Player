import { useEffect, useState } from "react";
import type { Track } from "@music-player/core";

interface Props {
  track: Track;
  eventKey: number;
  onDismiss: () => void;
  durationMs?: number;
}

export function NotificationToast({ track, eventKey, onDismiss, durationMs = 4500 }: Props) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setLeaving(false);
    const leaveTimer = window.setTimeout(() => setLeaving(true), durationMs);
    const dismissTimer = window.setTimeout(onDismiss, durationMs + 400);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(dismissTimer);
    };
    // eventKey changes on every track change, restarting the toast lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventKey, durationMs]);

  return (
    <div className={`toast ${leaving ? "toast-leaving" : "toast-entering"}`} role="status" aria-live="polite">
      {track.artwork ? (
        <img className="toast-artwork" src={track.artwork} alt="" />
      ) : (
        <div className="toast-artwork toast-artwork-placeholder">♪</div>
      )}
      <div className="toast-text">
        <div className="toast-eyebrow">Now playing</div>
        <div className="toast-title">{track.title}</div>
        {track.artist && <div className="toast-artist">{track.artist}</div>}
      </div>
    </div>
  );
}
