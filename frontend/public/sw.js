// Service Worker minimal pour les notifications Web Push (voir MDN Service Worker Cookbook - push-payload).
// Pas de mise en cache/offline ici : seul le support Push/Notification est géré.

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
