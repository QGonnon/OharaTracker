import axios from 'axios'
import type { Router } from 'vue-router'
import type { Pinia } from 'pinia'
import { useAuthStore } from '../store/auth.module'

// Endpoints où un 401 est un échec d'identifiants normal (mauvais mot de passe, etc.),
// pas une session expirée : ne doit jamais déclencher une déconnexion globale.
const AUTH_ENDPOINTS = ['/auth/signin', '/auth/signup', '/auth/google']

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint))
}

// Installe une gestion globale des 401 : si une requête authentifiée échoue avec un token
// expiré/invalide, on déconnecte l'utilisateur et on le renvoie vers la page de connexion,
// au lieu de laisser chaque service échouer silencieusement (cf. token JWT expiré sur /notifications/subscribe).
export function setupHttpInterceptors(pinia: Pinia, router: Router) {
  let handling = false

  const handleUnauthorized = () => {
    const authStore = useAuthStore(pinia)
    if (!authStore.isLoggedIn || handling) return
    handling = true

    authStore.logout()

    const current = router.currentRoute.value
    const query = current.name === 'Login' ? {} : { redirect: current.fullPath }
    router.push({ name: 'Login', query }).finally(() => {
      handling = false
    })
  }

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url || '')) {
        handleUnauthorized()
      }
      return Promise.reject(error)
    }
  )

  const originalFetch = window.fetch.bind(window)
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args)
    if (response.status === 401) {
      const input = args[0]
      const url = typeof input === 'string' ? input : (input as Request).url
      if (!isAuthEndpoint(url)) {
        handleUnauthorized()
      }
    }
    return response
  }
}
