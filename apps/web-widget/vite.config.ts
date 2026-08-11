import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "demo",
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MusicWidget",
      formats: ["iife", "es"],
      fileName: (format) => (format === "iife" ? "music-widget.js" : "music-widget.esm.js"),
    },
    rollupOptions: {
      output: {
        // Single self-contained file: any site can drop this in with one <script> tag.
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    port: 5174,
  },
});
