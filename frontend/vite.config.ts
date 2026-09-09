import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Ouvre la connexion DNS+TLS vers l'API/CDN pendant l'analyse du HTML, pour gagner sur le LCP.
const preconnectApi = (apiUrl: string): Plugin => ({
  name: 'ohara-preconnect-api',
  transformIndexHtml(html) {
    if (!apiUrl) return html.replace('<!-- ohara:preconnect -->', '')
    let origin: string
    try {
      origin = new URL(apiUrl).origin
    } catch {
      return html.replace('<!-- ohara:preconnect -->', '')
    }
    return html.replace(
      '<!-- ohara:preconnect -->',
      `<link rel="preconnect" href="${origin}" crossorigin />\n    <link rel="dns-prefetch" href="${origin}" />`
    )
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    tailwindcss(),
    preconnectApi(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL ?? ''),
    VitePWA({
      // Garde notre propre sw.js (push notifications) ; Workbox y injecte juste le precache.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
      },
      injectRegister: false, // enregistrement du SW déjà fait manuellement dans main.ts
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ohara Tracker',
        short_name: 'Ohara Tracker',
        description: 'Suivi de bibliothèque manga/anime : chapitres, épisodes et notifications.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#7c3aed',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: true, // active le SW aussi en `vite dev`, pratique pour tester l'offline
        type: 'module',
      },
    }),
  ],
  build: {
    sourcemap: true, // pas servies aux visiteurs, mais rendent les erreurs de prod lisibles

    // Utilisé par api/seo/spa.js pour précharger le chunk de la page demandée dès le HTML.
    manifest: true,
    rollupOptions: {
      output: {
        // PrimeVue n'est délibérément PAS regroupé ici : le nommer forcerait Rollup à inclure
        // son barrel entier (~680 Ko) au lieu des imports profonds (primevue/button) réels.
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
        },
      },
    },
  },
}))
