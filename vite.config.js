import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Allow PWA to work in development mode (npm run dev)
      devOptions: {
        enabled: true
      },
      // Removed favicon.ico, using the PNGs from public folder instead
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png', 'mask-icon.svg'],
      manifest: {
        name: 'Zip EasySpeak',
        short_name: 'EasySpeak',
        description: 'A free AAC dashboard by Zip Solutions',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'any',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})