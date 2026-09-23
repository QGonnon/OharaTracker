import type { Component } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../store/auth.module'
import { setLocale, detectPreferredLocale } from '../i18n'
import {
  MEDIA_SEGMENT_ALIASES, PAGE_SEGMENTS, MEDIA_SEGMENTS, isLocale,
  pageSegmentAliases, type Locale, type MediaKind, type PageKey,
} from '../seo/config'

// L'accueil est importé directement (page d'entrée la plus fréquente) ; le reste est à la demande.
import Home from '../components/Features/Home/Home.vue'

import MangaInfo from'../components/Features/Mangas/MangaInfo/MangaInfo.vue'
import Login from'../components/Auth/Login/Login.vue'
import Register from'../components/Auth/Register/Register.vue'
import Discovery from'../components/Features/Discovery/Discovery.vue'
import MangasListView from'../components/Features/Mangas/MangasListView/MangasListView.vue'
import Search from'../components/Features/Search/Search.vue'
import Profile from'../components/Features/User/Profile/Profile.vue'
import Stats from'../components/Features/User/Stats/Stats.vue'
import Watchlists from'../components/Features/User/Watchlists/Watchlists.vue'
import SharedWatchlist from'../components/Features/User/Watchlists/SharedWatchlist.vue'
import Community from'../components/Features/User/Community/Community.vue'
import NotificationsView from'../components/Features/Notifications/NotificationsView.vue'
import NotFound from'../components/Features/Static/NotFound/NotFound.vue'

import Pricing from'../components/Features/Static/Pricing/Pricing.vue'
import Blog from'../components/Features/Static/Blog/Blog.vue'
import Faq from'../components/Features/Static/Faq/Faq.vue'
import Status from'../components/Features/Static/Status/Status.vue'
import Changelog from'../components/Features/Static/Changelog/Changelog.vue'
import Suggestions from'../components/Features/Static/Suggestions/Suggestions.vue'
import SupportedSites from'../components/Features/Static/SupportedSites/SupportedSites.vue'
import OfficialPartners from'../components/Features/Static/OfficialPartners/OfficialPartners.vue'
import Contact from'../components/Features/Static/Contact/Contact.vue'
import Terms from'../components/Features/Static/Terms/Terms.vue'
import Privacy from'../components/Features/Static/Privacy/Privacy.vue'
import Cookies from'../components/Features/Static/Cookies/Cookies.vue'

// Optionnel pour que les anciennes URL sans préfixe matchent encore ; beforeEach les redirige.
const L = ':locale(fr|en|de|it|es)?'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    noindex?: boolean
    pageKey?: PageKey // source de vérité pour reconstruire l'URL canonique
    mediaKind?: MediaKind
    tokenParam?: boolean // la route porte un `:token` à conserver dans l'URL canonique
  }
}

const pageRoute = (
  key: PageKey,
  name: string,
  component: Component,
  meta: RouteRecordRaw['meta'] = {}
): RouteRecordRaw => {
  const segments = pageSegmentAliases(key)
  return {
    path: `/${L}/${segments[0]}`,
    alias: segments.slice(1).map(segment => `/${L}/${segment}`),
    name,
    component,
    meta: { pageKey: key, ...meta },
  }
}

const mediaRoute = (kind: MediaKind, name: string): RouteRecordRaw => {
  const segments = MEDIA_SEGMENT_ALIASES[kind]
  return {
    path: `/${L}/${segments[0]}/:name`,
    alias: segments.slice(1).map(segment => `/${L}/${segment}/:name`),
    name,
    component: MangaInfo,
    props: true,
    meta: { mediaKind: kind },
  }
}

// Une liste partagée vit sous le segment des listes, suffixé du jeton de partage :
// pas de page fixe correspondante, donc pas de `pageRoute` possible.
const sharedWatchlistRoute = (): RouteRecordRaw => {
  const segments = pageSegmentAliases('watchlists')
  return {
    path: `/${L}/${segments[0]}/:token`,
    alias: segments.slice(1).map(segment => `/${L}/${segment}/:token`),
    name: 'SharedWatchlist',
    component: SharedWatchlist,
    props: true,
    // `pageKey` rattache la route au segment traduit des listes ; `tokenParam`
    // dit a la canonicalisation de conserver le jeton. Sans les deux, l'URL
    // canonique calculee valait `/fr` et le garde renvoyait a l'accueil.
    meta: { noindex: true, pageKey: 'watchlists', tokenParam: true },
  }
}

const routes: RouteRecordRaw[] = [
  // Accueil : `/`, `/fr`, `/en`… Le `/home` historique est redirigé plus bas.
  {
    path: `/${L}`,
    name: 'Home',
    component: Home,
  },

  // Catalogue
  mediaRoute('lecture', 'MediaLecture'),
  mediaRoute('serie', 'MediaSerie'),
  mediaRoute('film', 'MediaFilm'),

  pageRoute('discovery', 'Discovery', Discovery),
  pageRoute('search', 'Search', Search),

  // Compte, jamais indexé : contenu privé, ou page sans valeur en recherche
  pageRoute('login', 'Login', Login, { noindex: true }),
  pageRoute('register', 'Register', Register, { noindex: true }),
  pageRoute('profile', 'Profile', Profile, { noindex: true, requiresAuth: true }),
  pageRoute('library', 'Library', MangasListView, { noindex: true, requiresAuth: true }),
  pageRoute('stats', 'Stats', Stats, { noindex: true, requiresAuth: true }),
  pageRoute('watchlists', 'Watchlists', Watchlists, { noindex: true, requiresAuth: true }),
  sharedWatchlistRoute(),
  pageRoute('community', 'Community', Community, { noindex: true, requiresAuth: true }),
  pageRoute('notifications', 'Notifications', NotificationsView, { noindex: true, requiresAuth: true }),

  // Pages publiques indexables
  pageRoute('pricing', 'Pricing', Pricing),
  pageRoute('blog', 'Blog', Blog),
  pageRoute('faq', 'Faq', Faq),
  pageRoute('status', 'Status', Status),
  pageRoute('changelog', 'Changelog', Changelog),
  pageRoute('suggestions', 'Suggestions', Suggestions),
  pageRoute('supportedSites', 'SupportedSites', SupportedSites),
  pageRoute('officialPartners', 'OfficialPartners', OfficialPartners),
  pageRoute('contact', 'Contact', Contact),
  pageRoute('terms', 'Terms', Terms),
  pageRoute('privacy', 'Privacy', Privacy),
  pageRoute('cookies', 'Cookies', Cookies),

  // Ancienne page d'accueil : une seule URL d'accueil par langue, pas deux.
  { path: `/${L}/home`, redirect: to => `/${localeOf(to.params.locale)}` },

  // Ancien groupe `/auth/login`
  { path: `/${L}/auth/login`, redirect: to => pathOf('login', to.params.locale) },
  { path: `/${L}/auth/register`, redirect: to => pathOf('register', to.params.locale) },
  { path: `/${L}/user/profile`, redirect: to => pathOf('profile', to.params.locale) },
  { path: `/${L}/user/list`, redirect: to => pathOf('library', to.params.locale) },

  // Tout le reste est une vraie 404, pas un soft-404 vers l'accueil.
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { noindex: true },
  },
]

const localeOf = (raw: unknown): Locale =>
  isLocale(raw) ? raw : detectPreferredLocale()

const pathOf = (key: PageKey, raw: unknown): string => {
  const locale = localeOf(raw)
  return `/${locale}/${PAGE_SEGMENTS[key][locale]}`
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
})

// Force chaque URL vers sa forme canonique, sinon un même contenu serait accessible sous plusieurs URL.
router.beforeEach(async (to, _from, next) => {
  // La route 404 attrape-tout ne déclare pas `locale` : on relit le préfixe dans le chemin.
  const urlLocale = isLocale(to.params.locale)
    ? to.params.locale
    : to.path.split('/').filter(Boolean)[0]

  const locale = localeOf(urlLocale)
  await setLocale(locale)

  if (to.name !== 'NotFound') {
    const canonical = canonicalPathFor(to, locale)
    if (canonical && canonical !== to.path) {
      next({ path: canonical, query: to.query, hash: to.hash, replace: true })
      return
    }
  }

  const authStore = useAuthStore()
  const loggedIn = authStore.isLoggedIn

  if (to.meta.requiresAuth && !loggedIn) {
    next({ path: pathOf('login', locale), query: { redirect: to.fullPath } })
    return
  }

  // Un utilisateur déjà connecté n'a rien à faire sur connexion/inscription.
  if (loggedIn && (to.name === 'Login' || to.name === 'Register')) {
    const redirect = to.query.redirect as string | undefined
    next(redirect && !redirect.includes('/login') && !redirect.includes('/register')
      ? redirect
      : pathOf('profile', locale))
    return
  }

  next()
})

function canonicalPathFor(
  to: {
    path: string
    params: Record<string, unknown>
    meta: { pageKey?: PageKey; mediaKind?: MediaKind; tokenParam?: boolean }
  },
  locale: Locale
): string | null {
  if (to.meta.pageKey) {
    const base = `/${locale}/${PAGE_SEGMENTS[to.meta.pageKey][locale]}`
    if (!to.meta.tokenParam) return base

    const token = String(to.params.token ?? '')
    // Pas d'encodage : le jeton est en base64url, il n'a rien a encoder, et un
    // ecart d'encodage entre le chemin calcule et le chemin reel ferait boucler
    // la redirection du garde.
    return token ? `${base}/${token}` : base
  }
  if (to.meta.mediaKind) {
    const slug = String(to.params.name ?? '')
    if (!slug) return null
    return `/${locale}/${MEDIA_SEGMENTS[to.meta.mediaKind][locale]}/${encodeURIComponent(slug)}`
  }
  return `/${locale}` // accueil
}

export default router
