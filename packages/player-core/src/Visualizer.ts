export type VisualizerStyle = "bars" | "wave" | "pulse" | "off";

/**
 * Draws an audio-reactive visualization onto a <canvas> from a Web Audio
 * AnalyserNode (see PlayerEngine.getAnalyser()). Framework-agnostic so both
 * the React desktop app and the vanilla web widget can share one
 * implementation instead of re-deriving canvas math twice.
 */
export class ReactiveVisualizer {
  private canvas: HTMLCanvasElement;
  private analyser: AnalyserNode;
  private style: VisualizerStyle;
  private color: string;
  private freqData: Uint8Array<ArrayBuffer>;
  private timeData: Uint8Array<ArrayBuffer>;
  private rafId: number | null = null;

  constructor(canvas: HTMLCanvasElement, analyser: AnalyserNode, options: { style?: VisualizerStyle; color?: string } = {}) {
    this.canvas = canvas;
    this.analyser = analyser;
    this.style = options.style ?? "bars";
    this.color = options.color ?? "#6c5ce7";
    this.freqData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    this.timeData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  }

  setStyle(style: VisualizerStyle): void {
    this.style = style;
  }

  setColor(color: string): void {
    this.color = color;
  }

  start(): void {
    if (this.rafId !== null) return;
    const loop = () => {
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  destroy(): void {
    this.stop();
  }

  private resizeToDisplaySize(): { width: number; height: number } {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const targetW = Math.max(1, Math.round(width * dpr));
    const targetH = Math.max(1, Math.round(height * dpr));
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }
    return { width, height };
  }

  private draw(): void {
    if (this.style === "off") return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = this.resizeToDisplaySize();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (this.style === "bars") this.drawBars(ctx, width, height);
    else if (this.style === "wave") this.drawWave(ctx, width, height);
    else if (this.style === "pulse") this.drawPulse(ctx, width, height);
  }

  private drawBars(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.analyser.getByteFrequencyData(this.freqData);
    const barCount = Math.min(48, this.freqData.length);
    const step = Math.max(1, Math.floor(this.freqData.length / barCount));
    const barWidth = width / barCount;
    ctx.fillStyle = this.color;
    for (let i = 0; i < barCount; i += 1) {
      const value = this.freqData[i * step] / 255;
      const barHeight = Math.max(2, value * height);
      ctx.globalAlpha = 0.35 + value * 0.65;
      ctx.fillRect(i * barWidth + 1, height - barHeight, Math.max(1, barWidth - 2), barHeight);
    }
    ctx.globalAlpha = 1;
  }

  private drawWave(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.analyser.getByteTimeDomainData(this.timeData);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const step = width / this.timeData.length;
    for (let i = 0; i < this.timeData.length; i += 1) {
      const v = this.timeData[i] / 128 - 1;
      const y = height / 2 + v * (height / 2) * 0.9;
      const x = i * step;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  private drawPulse(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.analyser.getByteFrequencyData(this.freqData);
    let sum = 0;
    for (let i = 0; i < this.freqData.length; i += 1) sum += this.freqData[i];
    const avg = sum / this.freqData.length / 255;
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(width, height) / 2;
    const radius = Math.max(2, maxRadius * (0.35 + avg * 0.65));
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
