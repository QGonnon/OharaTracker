// Service Worker : notifications Web Push (voir MDN Service Worker Cookbook - push-payload)
// + mise en cache de l'app shell (precache Workbox injecté par vite-plugin-pwa en mode injectManifest)
// pour permettre le chargement de l'application hors-ligne.

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'

// Injecté au build par vite-plugin-pwa : liste des assets buildés (JS/CSS/HTML/icônes) à précacher.
precacheAndRoute(self.__WB_MANIFEST)
// Supprime les caches d'un précédent build lors de la mise à jour du SW.
cleanupOutdatedCaches()

// App Vue en SPA (vue-router en mode history) : toute navigation (ex: /library, /notifications)
// doit servir index.html depuis le precache pour fonctionner hors-ligne.
// (l'API backend étant sur une autre origine, ces requêtes ne passent pas par cette route.)
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

self.skipWaiting()
self.addEventListener('activate', () => self.clients.claim())

self.addEventListener('push', (event) => {
  let payload = { title: 'Ohara Tracker', chapter: '', idLibrary: null }
  try {
    payload = event.data ? event.data.json() : payload
  } catch (e) {
    payload.title = event.data ? event.data.text() : payload.title
  }

  const title = payload.title || 'Ohara Tracker'
  const body = payload.chapter ? `Chapitre ${payload.chapter} disponible` : 'Nouveau contenu disponible'
  const url = payload.idLibrary ? `/notifications` : '/notifications'

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        data: { url, idLibrary: payload.idLibrary },
      }),
      // Prévient les onglets déjà ouverts pour rafraîchir le badge instantanément (bonus, pas le mécanisme de livraison)
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'notifications-refresh' }))
      }),
    ])
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/notifications'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
