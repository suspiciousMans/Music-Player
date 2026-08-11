import type { PlayerEngine, PlayerState } from "@music-player/core";

interface Props {
  engine: PlayerEngine;
  state: PlayerState;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export function PlayerBar({ engine, state }: Props) {
  const { track, isPlaying, currentTime, duration, volume, muted, shuffle, repeat } = state;

  return (
    <div className="player-bar">
      <div className="player-bar-meta">
        {track ? (
          <>
            {track.artwork ? (
              <img className="player-bar-art" src={track.artwork} alt="" />
            ) : (
              <div className="player-bar-art player-bar-art-placeholder">♪</div>
            )}
            <div>
              <div className="player-bar-title">{track.title}</div>
              <div className="player-bar-artist">{track.artist ?? "Unknown artist"}</div>
            </div>
          </>
        ) : (
          <div className="player-bar-empty">Add music to get started</div>
        )}
      </div>

      <div className="player-bar-controls">
        <div className="player-bar-buttons">
          <button
            className={`icon-btn ${shuffle ? "icon-btn-active" : ""}`}
            title="Shuffle"
            onClick={() => engine.setShuffle(!shuffle)}
          >
            ⤨
          </button>
          <button className="icon-btn" title="Previous" onClick={() => engine.previous()}>
            ⏮
          </button>
          <button className="icon-btn icon-btn-play" title={isPlaying ? "Pause" : "Play"} onClick={() => engine.toggle()}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className="icon-btn" title="Next" onClick={() => engine.next()}>
            ⏭
          </button>
          <button
            className={`icon-btn ${repeat !== "off" ? "icon-btn-active" : ""}`}
            title={`Repeat: ${repeat}`}
            onClick={() => engine.setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
          >
            {repeat === "one" ? "🔂" : "🔁"}
          </button>
        </div>
        <div className="player-bar-seek">
          <span className="time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => engine.seek(Number(e.target.value))}
          />
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-bar-volume">
        <button className="icon-btn" title={muted ? "Unmute" : "Mute"} onClick={() => engine.setMuted(!muted)}>
          {muted || volume === 0 ? "🔇" : "🔊"}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => engine.setVolume(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
