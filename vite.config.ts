import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLE=1 builds one self-contained HTML file (used for quick cloud previews).
const single = !!process.env.SINGLE

export default defineConfig({
  base: './',
  plugins: [
    react(),
    ...(single
      ? [viteSingleFile()]
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
              name: 'Little Learners',
              short_name: 'Little Learners',
              description: 'A calm learning app for ages 1 to 3, used together with a parent.',
              theme_color: '#f6efe3',
              background_color: '#f6efe3',
              display: 'standalone',
              start_url: './',
              icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
            },
            workbox: { globPatterns: ['**/*.{js,css,html,svg,json,webp,m4a}'] },
          }),
        ]),
  ],
  test: { include: ['src/**/*.test.ts'] },
})
