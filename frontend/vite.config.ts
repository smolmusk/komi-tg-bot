import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: true,
    cors: true,
    hmr: process.env.NODE_ENV === "production" ? false : undefined,
  },
  build: {
    outDir: "dist",
  },
});
