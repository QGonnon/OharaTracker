import type { Component } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../store/auth.module'
import { setLocale, detectPreferredLocale } from '../i18n'
import {
  MEDIA_SEGMENT_ALIASES, PAGE_SEGMENTS, MEDIA_SEGMENTS, isLocale,
  pageSegmentAliases, type Locale, type MediaKind, type PageKey,
} from '../seo/config'

// L'accueil est importé directement : c'est la page d'entrée la plus fréquente,
// la charger en différé ajouterait un aller-retour réseau avant le premier rendu.
import Home from '../components/Features/Home/Home.vue'

// Toutes les autres pages sont chargées à la demande. Sans ça, ouvrir la fiche
// d'un manga téléchargeait aussi le code des tarifs, du profil, des mentions
// légales et de la recherche — un seul bundle de 1,4 Mo pour chaque visiteur.
const MangaInfo = () => import('../components/Features/Mangas/MangaInfo/MangaInfo.vue')
const Login = () => import('../components/Auth/Login/Login.vue')
const Register = () => import('../components/Auth/Register/Register.vue')
const Discovery = () => import('../components/Features/Discovery/Discovery.vue')
const MangasListView = () => import('../components/Features/Mangas/MangasListView/MangasListView.vue')
const Search = () => import('../components/Features/Search/Search.vue')
const Profile = () => import('../components/Features/User/Profile/Profile.vue')
const NotificationsView = () => import('../components/Features/Notifications/NotificationsView.vue')
const NotFound = () => import('../components/Features/Static/NotFound/NotFound.vue')

// Pages statiques / footer
const Pricing = () => import('../components/Features/Static/Pricing/Pricing.vue')
const Blog = () => import('../components/Features/Static/Blog/Blog.vue')
const Status = () => import('../components/Features/Static/Status/Status.vue')
const Changelog = () => import('../components/Features/Static/Changelog/Changelog.vue')
const Suggestions = () => import('../components/Features/Static/Suggestions/Suggestions.vue')
const SupportedSites = () => import('../components/Features/Static/SupportedSites/SupportedSites.vue')
const OfficialPartners = () => import('../components/Features/Static/OfficialPartners/OfficialPartners.vue')
const Contact = () => import('../components/Features/Static/Contact/Contact.vue')
const Terms = () => import('../components/Features/Static/Terms/Terms.vue')
const Privacy = () => import('../components/Features/Static/Privacy/Privacy.vue')
const Cookies = () => import('../components/Features/Static/Cookies/Cookies.vue')

/**
 * Préfixe de langue, optionnel dans le pattern pour que les anciennes URL sans
 * préfixe continuent de matcher — le garde `beforeEach` les redirige ensuite
 * vers leur forme canonique préfixée.
 */
const L = ':locale(fr|en|de|it|es)?'

declare module 'vue-router' {
  interface RouteMeta {
    /** Page réservée aux utilisateurs connectés. */
    requiresAuth?: boolean
    /** Page qui ne doit jamais être indexée (espace privé, 404, tunnel d'inscription). */
    noindex?: boolean
    /** Clé de page fixe, source de vérité pour reconstruire l'URL canonique. */
    pageKey?: PageKey
    /** Nature d'œuvre déduite du segment d'URL emprunté. */
    mediaKind?: MediaKind
  }
}

/**
 * Route d'une page fixe : le chemin canonique est celui de la langue de l'URL,
 * et tous les segments des autres langues (plus les anciens chemins) sont
 * acceptés en alias pour être redirigés vers lui.
 */
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

/** Route d'une œuvre, pour une nature donnée et tous ses segments équivalents. */
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

  // Tout le reste est une vraie 404 : on n'envoie plus le visiteur (ni Google)
  // sur l'accueil, ce qui produisait un « soft 404 » sur chaque URL morte.
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

/**
 * Aligne la langue de l'application sur l'URL, puis force chaque URL vers sa
 * forme canonique : préfixe de langue présent, et segment écrit dans la langue
 * de ce préfixe. Sans ça un même contenu resterait accessible sous plusieurs
 * URL (`/pricing`, `/fr/pricing`, `/fr/tarifs`) — du duplicate content.
 */
router.beforeEach((to, _from, next) => {
  // Sur une 404 le paramètre `locale` n'est pas renseigné (la route attrape-tout
  // n'en déclare pas) : on relit le préfixe dans le chemin pour afficher la page
  // d'erreur dans la langue que le visiteur avait demandée.
  const urlLocale = isLocale(to.params.locale)
    ? to.params.locale
    : to.path.split('/').filter(Boolean)[0]

  const locale = localeOf(urlLocale)
  setLocale(locale)

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

  // Un utilisateur déjà connecté n'a rien à faire sur connexion/inscription
  if (loggedIn && (to.name === 'Login' || to.name === 'Register')) {
    const redirect = to.query.redirect as string | undefined
    next(redirect && !redirect.includes('/login') && !redirect.includes('/register')
      ? redirect
      : pathOf('profile', locale))
    return
  }

  next()
})

/** Chemin canonique de la route visée, ou `null` s'il n'y a rien à corriger. */
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
  // Accueil
  return `/${locale}`
}

export default router
