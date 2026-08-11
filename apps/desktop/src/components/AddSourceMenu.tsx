import { useState } from "react";
import type { Track } from "@music-player/core";

interface Props {
  onAdd: (tracks: Track[]) => void;
}

function trackFromUrl(url: string): Track {
  let title = url;
  try {
    title = decodeURIComponent(new URL(url).pathname.split("/").pop() || url);
  } catch {
    // not a valid URL structure, fall back to raw string as the title
  }
  return { id: url, title, src: url };
}

export function AddSourceMenu({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");

  async function handle(action: () => Promise<Track[]>) {
    const tracks = await action();
    if (tracks.length > 0) onAdd(tracks);
    setOpen(false);
  }

  function handleAddStream(e: React.FormEvent) {
    e.preventDefault();
    const url = streamUrl.trim();
    if (!url) return;
    onAdd([trackFromUrl(url)]);
    setStreamUrl("");
    setOpen(false);
  }

  return (
    <div className="add-source">
      <button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
        + Add music
      </button>
      {open && (
        <div className="add-source-menu">
          <button className="add-source-item" onClick={() => void handle(() => window.musicPlayerAPI.openFiles())}>
            🎵 Audio files…
          </button>
          <button className="add-source-item" onClick={() => void handle(() => window.musicPlayerAPI.openFolder())}>
            📁 Folder…
          </button>
          <button className="add-source-item" onClick={() => void handle(() => window.musicPlayerAPI.openPlaylist())}>
            📜 M3U playlist…
          </button>
          <form className="add-source-stream" onSubmit={handleAddStream}>
            <input
              type="url"
              placeholder="Paste a stream/audio URL"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
            <button type="submit" className="btn">
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
