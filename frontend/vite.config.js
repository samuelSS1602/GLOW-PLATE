import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // The Firebase chunk (with the offline cache) is ~550 kB, 130 kB gzipped, and cached on its own
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: { manualChunks: { firebase: ["firebase/app", "firebase/auth", "firebase/firestore"] } },
    },
  },
  server: {
    host: true,
    // Always the same address: to the browser a different port is a different site, which means signed out
    port: 5173,
    strictPort: true,
    // In development, /api calls go to the Python backend
    proxy: { "/api": "http://localhost:8000" },
  },
});
