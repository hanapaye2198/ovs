import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const spaRoutes = ["auth", "channels", "dashboard", "features", "pay", "portal", "support"];

function copySpaRouteEntries() {
  return {
    name: "copy-spa-route-entries",
    closeBundle() {
      const indexPath = path.resolve(configDir, "dist/index.html");

      for (const route of spaRoutes) {
        const routeDir = path.resolve(configDir, "dist", route);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.copyFileSync(indexPath, path.join(routeDir, "index.html"));
      }
    },
  };
}

export default defineConfig({
  root: configDir,
  plugins: [react(), tailwindcss(), copySpaRouteEntries()],
  resolve: {
    alias: {
      "@": path.resolve(configDir, "../src"),
      "@tanstack/react-start/server": path.resolve(configDir, "./react-start-server.ts"),
      "@tanstack/start-storage-context": path.resolve(configDir, "./start-storage-context.ts"),
      "@tanstack/react-start": path.resolve(configDir, "./react-start-client.ts"),
    },
  },
  build: {
    outDir: path.resolve(configDir, "dist"),
    emptyOutDir: true,
  },
});
