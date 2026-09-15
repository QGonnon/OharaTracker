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

const MangaInfo = () => import('../components/Features/Mangas/MangaInfo/MangaInfo.vue')
const Login = () => import('../components/Auth/Login/Login.vue')
const Register = () => import('../components/Auth/Register/Register.vue')
const Discovery = () => import('../components/Features/Discovery/Discovery.vue')
const MangasListView = () => import('../components/Features/Mangas/MangasListView/MangasListView.vue')
const Search = () => import('../components/Features/Search/Search.vue')
const Profile = () => import('../components/Features/User/Profile/Profile.vue')
const NotificationsView = () => import('../components/Features/Notifications/NotificationsView.vue')
const NotFound = () => import('../components/Features/Static/NotFound/NotFound.vue')

const Pricing = () => import('../components/Features/Static/Pricing/Pricing.vue')
const Blog = () => import('../components/Features/Static/Blog/Blog.vue')
const Faq = () => import('../components/Features/Static/Faq/Faq.vue')
const Status = () => import('../components/Features/Static/Status/Status.vue')
const Changelog = () => import('../components/Features/Static/Changelog/Changelog.vue')
const Suggestions = () => import('../components/Features/Static/Suggestions/Suggestions.vue')
const SupportedSites = () => import('../components/Features/Static/SupportedSites/SupportedSites.vue')
const OfficialPartners = () => import('../components/Features/Static/OfficialPartners/OfficialPartners.vue')
const Contact = () => import('../components/Features/Static/Contact/Contact.vue')
const Terms = () => import('../components/Features/Static/Terms/Terms.vue')
const Privacy = () => import('../components/Features/Static/Privacy/Privacy.vue')
const Cookies = () => import('../components/Features/Static/Cookies/Cookies.vue')

// Optionnel pour que les anciennes URL sans préfixe matchent encore ; beforeEach les redirige.
const L = ':locale(fr|en|de|it|es)?'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    noindex?: boolean
    pageKey?: PageKey // source de vérité pour reconstruire l'URL canonique
    mediaKind?: MediaKind
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

  // Compte — jamais indexé : contenu privé, ou page sans valeur en recherche
  pageRoute('login', 'Login', Login, { noindex: true }),
  pageRoute('register', 'Register', Register, { noindex: true }),
  pageRoute('profile', 'Profile', Profile, { noindex: true, requiresAuth: true }),
  pageRoute('library', 'Library', MangasListView, { noindex: true, requiresAuth: true }),
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
  to: { path: string; params: Record<string, unknown>; meta: { pageKey?: PageKey; mediaKind?: MediaKind } },
  locale: Locale
): string | null {
  if (to.meta.pageKey) {
    return `/${locale}/${PAGE_SEGMENTS[to.meta.pageKey][locale]}`
  }
  if (to.meta.mediaKind) {
    const slug = String(to.params.name ?? '')
    if (!slug) return null
    return `/${locale}/${MEDIA_SEGMENTS[to.meta.mediaKind][locale]}/${encodeURIComponent(slug)}`
  }
  return `/${locale}` // accueil
}

export default router
