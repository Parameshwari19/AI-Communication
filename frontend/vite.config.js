import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration: React plugin + dev server settings.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
