/**
 * Wie die Oberfläche gebaut wird.
 *
 * Drei Bausteine:
 *
 *   react()        – JSX und schnelles Nachladen beim Entwickeln
 *   tailwindcss()  – die Hilfsklassen; die eigenen Regeln stehen in src/stile/
 *   VitePWA()      – macht den Almanach installierbar (Home-Bildschirm auf
 *                    iPad und Telefon) und hält ihn im Zwischenspeicher
 *
 * Beim Zwischenspeicher gilt je Art von Anfrage eine andere Regel, und das
 * mit Absicht:
 *
 *   Kompendium   CacheFirst   – Regeltexte ändern sich nicht; einmal geholt,
 *                               kommen sie vom Gerät, auch ohne Netz
 *   Blätter      NetworkFirst – immer den frischen Stand, aber nach drei
 *                               Sekunden ohne Antwort lieber den letzten
 *                               bekannten als gar keinen
 *   Bilder       CacheFirst   – eine Kennung, ein Bild, für immer
 *
 * Alles andere unter /api/ geht nie über den Zwischenspeicher: Kampf, Nebel
 * und Würfe veraltet anzuzeigen wäre schlimmer, als sie gar nicht zu zeigen.
 *
 * Beim Entwickeln (`npm run dev`) leitet Vite /api an den Server auf Port
 * 3001 weiter – so laufen Oberfläche und Server getrennt und trotzdem unter
 * einer Adresse, und das Anmelde-Cookie funktioniert wie im Betrieb.
 */
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Abenteuer-Almanach – Spieltisch, Charaktere und Spielleitung',
        short_name: 'Almanach',
        description: 'Selbst gehostete Runde für D&D 5e: Charakterblätter, Spieltisch mit Nebel des Krieges und Spielleitungs-Board',
        theme_color: '#382718',
        background_color: '#e6d7b0',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/compendium'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'compendium-cache',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/characters'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'characters-cache',
              networkTimeoutSeconds: 3,
            },
          },
          {
            // Karten und Bildnisse ändern sich unter einer Kennung nie –
            // einmal geladen, bleiben sie auf dem Gerät.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'medien-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
