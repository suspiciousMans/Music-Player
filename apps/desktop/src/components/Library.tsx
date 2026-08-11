import type { Track } from "@music-player/core";

interface Props {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onPlay: (index: number) => void;
  onRemove: (index: number) => void;
}

export function Library({ tracks, currentIndex, isPlaying, onPlay, onRemove }: Props) {
  if (tracks.length === 0) {
    return (
      <div className="library-empty">
        <p>Your library is empty.</p>
        <p>Use “Add music” above to import files, a folder, a playlist, or a stream URL.</p>
      </div>
    );
  }

  return (
    <ul className="library-list">
      {tracks.map((track, index) => {
        const active = index === currentIndex;
        return (
          <li key={track.id} className={`library-row ${active ? "library-row-active" : ""}`}>
            <button className="library-row-play" onClick={() => onPlay(index)}>
              <span className="library-row-indicator">{active && isPlaying ? "♫" : active ? "⏸" : index + 1}</span>
              <span className="library-row-text">
                <span className="library-row-title">{track.title}</span>
                <span className="library-row-artist">{track.artist ?? "Unknown artist"}</span>
              </span>
            </button>
            <button className="library-row-remove" title="Remove" onClick={() => onRemove(index)}>
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
