import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Avatar-Driver/",
  resolve: {
    dedupe: ["three"],
  },
  build: {
    outDir: "dist",
    target: "es2022",
    sourcemap: true,
  },
  worker: {
    format: "es",
  },
});
