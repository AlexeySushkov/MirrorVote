import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'inline',
      devOptions: { enabled: false },

      manifest: {
        name: 'MirrorVote — AI-помощник в примерочной',
        short_name: 'MirrorVote',
        description: 'Сравни образы, получи AI-анализ и собери голоса друзей',
        lang: 'ru',
        start_url: '/app/',
        scope: '/app/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#ffffff',
        theme_color: '#e05c7e',
        icons: [
          {
            src: '/app/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/app/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/app/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,png}'],
        globIgnores: ['**/config.js'],

        navigateFallback: '/app/index.html',
        navigateFallbackAllowlist: [/^\/app\//],

        skipWaiting: false,
        // clientsClaim: true нужен чтобы после skipWaiting новый SW
        // взял контроль над страницей и сработал controllerchange →
        // updateServiceWorker(true) смог вызвать window.location.reload()
        clientsClaim: true,

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'gfonts-css',
              expiration: { maxAgeSeconds: 604800 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gfonts-woff2',
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: ['mirror-vote.ru', 'www.mirror-vote.ru', 'mirrorvote.ru', 'www.mirrorvote.ru'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
