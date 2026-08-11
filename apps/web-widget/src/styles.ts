export const WIDGET_STYLES = /* css */ `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --mp-bg: #1c1c1e;
  --mp-bg-hover: #26262a;
  --mp-border: #2c2c30;
  --mp-text: #f2f2f5;
  --mp-text-dim: #9a9aa2;
  --mp-accent: #6c5ce7;
  color-scheme: dark;
}

:host([theme="light"]) {
  --mp-bg: #ffffff;
  --mp-bg-hover: #eeeef1;
  --mp-border: #e2e2e7;
  --mp-text: #17171a;
  --mp-text-dim: #6b6b74;
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

.dock {
  position: fixed;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 280px;
}

.dock[data-position="bottom-right"] { bottom: 20px; right: 20px; align-items: flex-end; }
.dock[data-position="bottom-left"] { bottom: 20px; left: 20px; align-items: flex-start; }
.dock[data-position="top-right"] { top: 20px; right: 20px; align-items: flex-end; }
.dock[data-position="top-left"] { top: 20px; left: 20px; align-items: flex-start; }

.card {
  width: 100%;
  background: var(--mp-card-bg, var(--mp-bg));
  border: 1px solid var(--mp-border);
  border-radius: 14px;
  padding: 12px;
  color: var(--mp-text);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.visualizer {
  width: 100%;
  height: 30px;
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(127, 127, 127, 0.08);
}

.visualizer-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.art,
.art-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.art-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--mp-bg-hover);
  color: var(--mp-text-dim);
}

.meta {
  min-width: 0;
  flex: 1;
}

.title {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist {
  font-size: 11px;
  color: var(--mp-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.buttons {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

button.icon {
  background: none;
  border: none;
  color: var(--mp-text);
  cursor: pointer;
  font-size: 15px;
  padding: 6px;
  border-radius: 6px;
  line-height: 1;
}

button.icon:hover {
  background: var(--mp-bg-hover);
}

.progress-track {
  margin-top: 10px;
  height: 3px;
  border-radius: 2px;
  background: var(--mp-border);
  overflow: hidden;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: var(--mp-accent);
  width: 0%;
}

.badge {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--mp-text-dim);
  margin-bottom: 6px;
}

/* Toast */
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: var(--mp-bg);
  border: 1px solid var(--mp-border);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.toast-entering {
  animation: mp-slide-in 0.35s ease-out;
}

.toast-leaving {
  animation: mp-slide-out 0.35s ease-in forwards;
}

.dock[data-position$="left"] .toast-entering { animation-name: mp-slide-in-left; }
.dock[data-position$="left"] .toast-leaving { animation-name: mp-slide-out-left; }

@keyframes mp-slide-in {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes mp-slide-out {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(120%); opacity: 0; }
}
@keyframes mp-slide-in-left {
  from { transform: translateX(-120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes mp-slide-out-left {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-120%); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .toast-entering, .toast-leaving { animation: none; }
}

.toast-eyebrow {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--mp-accent);
  font-weight: 600;
}

.toast-title {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toast-artist {
  font-size: 11px;
  color: var(--mp-text-dim);
}

.hint {
  font-size: 11px;
  color: var(--mp-text-dim);
  text-align: center;
  padding: 4px 0 0;
}
`;
