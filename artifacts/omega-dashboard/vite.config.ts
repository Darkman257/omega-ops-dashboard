// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "../../node_modules/.pnpm/@tailwindcss+vite@4.2.1_vite@7.3.2_@types+node@25.3.5_jiti@2.6.1_lightningcss@1.31.1_tsx@4.21.0_yaml@2.8.2_/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = Number(process.env.PORT ?? "3000");
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
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
