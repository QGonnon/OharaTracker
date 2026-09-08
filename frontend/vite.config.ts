import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Ouvre la connexion vers l'API/CDN pendant l'analyse du HTML.
 *
 * Les couvertures sont servies par une autre origine que l'app : sans
 * `preconnect`, le navigateur ne commence DNS + TLS qu'au moment où il découvre
 * la première image, soit plusieurs centaines de millisecondes perdues sur le
 * LCP. La balise n'est émise que si l'URL de l'API est réellement configurée.
 */
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
        // Active le SW (avec precache) aussi en `vite dev`, pratique pour tester l'offline en local.
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    // Les source maps ne sont pas servies aux visiteurs (le navigateur ne les
    // télécharge que si les outils de développement sont ouverts) mais rendent
    // les erreurs de production lisibles au lieu d'être minifiées.
    sourcemap: true,

    // Le manifeste associe chaque module source à son fichier compilé.
    // `api/seo/spa.js` s'en sert pour précharger le chunk de la page demandée
    // dès le HTML : sans lui, le navigateur ne découvre le chunk de la route
    // qu'après avoir téléchargé et exécuté le bundle principal, soit un
    // aller-retour réseau complet ajouté sur chaque page hors accueil.
    manifest: true,
    rollupOptions: {
      output: {
        // Le socle Vue change bien moins souvent que le code applicatif : l'isoler
        // permet au navigateur de garder son cache d'une mise en ligne à l'autre.
        //
        // PrimeVue n'est délibérément PAS regroupé ici : nommer le paquet dans
        // `manualChunks` force Rollup à inclure son barrel entier (~680 Ko),
        // ce qui annulerait les imports profonds (`primevue/button`) des
        // composants. Laissé libre, Rollup ne garde que ce qui est réellement importé.
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
        },
      },
    },
  },
}))
