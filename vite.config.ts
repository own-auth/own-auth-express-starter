import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const clientPort = Number(process.env.VITE_PORT ?? 3000);
const apiPort = Number(process.env.PORT ?? 3001);

export default defineConfig({
  build: {
    outDir: "dist/client"
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    host: "127.0.0.1",
    port: clientPort,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${apiPort}`
      }
    }
  }
});
