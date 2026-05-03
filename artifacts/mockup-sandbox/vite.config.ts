// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

let tailwindcssPlugin;
const pnpmDir = path.resolve(import.meta.dirname, "../../node_modules/.pnpm");
if (fs.existsSync(pnpmDir)) {
  const dirs = fs.readdirSync(pnpmDir).filter(d => d.startsWith("@tailwindcss+vite"));
  if (dirs.length > 0) {
    const p = path.join(pnpmDir, dirs[0], "node_modules/@tailwindcss/vite/dist/index.mjs");
    if (fs.existsSync(p)) {
      tailwindcssPlugin = (await import(p)).default;
    }
  }
}
if (!tailwindcssPlugin) {
  try {
    tailwindcssPlugin = (await import("@tailwindcss/vite")).default;
  } catch (e) {
    // fallback
  }
}
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

const rawPort = process.env.PORT || "3000";
const port = Number(rawPort);
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    mockupPreviewPlugin(),
    react(),
    tailwindcssPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "tailwindcss": path.resolve(import.meta.dirname, "../../node_modules/.pnpm/tailwindcss@4.2.1/node_modules/tailwindcss/index.css"),
      "tw-animate-css": path.resolve(import.meta.dirname, "../../node_modules/.pnpm/tw-animate-css@1.4.0/node_modules/tw-animate-css/dist/tw-animate.css"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    modulePreload: false,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
