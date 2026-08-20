import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      // On garde notre propre sw.js (push notifications) : Workbox y injecte juste le precache
      // de l'app shell (self.__WB_MANIFEST) au lieu de générer un service worker complet.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        // src/sw.js importe des modules (workbox-precaching, workbox-routing) : on le laisse bundler.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
      },
      // L'enregistrement du SW est déjà fait manuellement dans main.ts.
      injectRegister: false,
      manifest: false,
      devOptions: {
        // Active le SW (avec precache) aussi en `vite dev`, pratique pour tester l'offline en local.
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
