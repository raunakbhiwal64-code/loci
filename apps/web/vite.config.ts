import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

// Workspace packages are consumed from TS source; Vite/esbuild transpiles them.
const pkg = (p: string) => fileURLToPath(new URL(`../../packages/${p}/src/index.ts`, import.meta.url));
const mod = (p: string) => fileURLToPath(new URL(`../../modules/${p}/src/index.ts`, import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Loci — Thinking Skills",
        short_name: "Loci",
        description: "Real thinking skills for kids 8–12: memory, chess, mental math and more.",
        theme_color: "#c9622b",
        background_color: "#f4ecd8",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@loci/module-sdk": pkg("module-sdk"),
      "@loci/core-progression": pkg("core-progression"),
      "@loci/core-srs": pkg("core-srs"),
      "@loci/data-local": pkg("data-local"),
      "@loci/ai-gateway": pkg("ai-gateway"),
      "@loci/analytics": pkg("analytics"),
      "@loci/design-system": pkg("design-system"),
      "@loci/memora": mod("memora"),
      "@loci/placeholder": mod("placeholder"),
    },
  },
  build: {
    target: "es2020",
    // Bundle-budget discipline (PRD 5.9): warn if the Hub shell grows large.
    chunkSizeWarningLimit: 220,
  },
});
