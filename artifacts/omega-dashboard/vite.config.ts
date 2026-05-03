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
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = Number(process.env.PORT ?? "3000");
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcssPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "tailwindcss": path.resolve(import.meta.dirname, "../../node_modules/.pnpm/tailwindcss@4.2.1/node_modules/tailwindcss/index.css"),
      "tw-animate-css": path.resolve(import.meta.dirname, "../../node_modules/.pnpm/tw-animate-css@1.4.0/node_modules/tw-animate-css/dist/tw-animate.css"),
      "@tailwindcss/typography": path.resolve(import.meta.dirname, "../../node_modules/.pnpm/@tailwindcss+typography@0.5.15/node_modules/@tailwindcss/typography"),
      "@assets": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "attached_assets",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    modulePreload: false,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
