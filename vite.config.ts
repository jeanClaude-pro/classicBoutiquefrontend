import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiUrl = env.VITE_API_URL?.trim()

  // The API is reached on the site's own origin ("/api"): Netlify forwards it
  // to the server (netlify.toml) and the Vite dev server does the same locally.
  // Same origin is what lets the session live in an httpOnly, SameSite=Strict
  // cookie that page scripts never see (and that iPhones accept).
  if (mode === 'production' && apiUrl !== '/api') {
    throw new Error(
      'Production VITE_API_URL must be "/api" (same origin, proxied by Netlify to the server).',
    )
  }
  const devApiTarget = env.VITE_DEV_API_TARGET?.trim() || 'http://localhost:5000'

  return {
    // Production bundles never publish source maps (they would expose the
    // original source to anyone).
    build: { sourcemap: false },
    // Development: /api is forwarded to the local server, keeping the browser
    // on one origin exactly like production. The Origin header is kept so the
    // server's CLIENT_URL check applies.
    server: {
      proxy: {
        '/api': { target: devApiTarget, changeOrigin: false },
      },
    },
    // Production bundles carry no console output or debugger statements:
    // diagnostics stay in development and are never shown to shop users.
    esbuild: mode === 'production' ? { drop: ['console', 'debugger'], legalComments: 'none' } : undefined,
    plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['newlogo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'ETS DOUBLE M CLASSIC BOUTIQUE',
        short_name: 'DOUBLE M',
        description: 'Gestion boutique, stock et point de vente DOUBLE M',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f5f7fa',
        theme_color: '#0b1c2d',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: [
          '**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2}',
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    ],
  }
})
