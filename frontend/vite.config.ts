import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "komi-frontend-production.up.railway.app",
      "komi-tg-bot-frontend.vercel.app",
      ".up.railway.app",
      ".vercel.app",
    ],
  },
  build: {
    outDir: "dist",
  },
});
