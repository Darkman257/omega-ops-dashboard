// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
let tailwindcssPlugin;
try {
  tailwindcssPlugin = (await import("@tailwindcss/vite")).default;
} catch (e) {
  tailwindcssPlugin = (await import("../../node_modules/.pnpm/@tailwindcss+vite@4.2.1_vite@7.3.2_@types+node@25.3.5_jiti@2.6.1_lightningcss@1.31.1_tsx@4.21.0_yaml@2.8.2_/node_modules/@tailwindcss/vite/dist/index.mjs")).default;
}
import path from "path";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
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
    // runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
        ]
      : []),
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
