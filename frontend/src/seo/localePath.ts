import type { App } from 'vue'
import i18n from '../i18n'
import {
  DEFAULT_LOCALE, LOCALES, MEDIA_SEGMENTS, PAGE_SEGMENTS, SEGMENT_TO_KIND,
  isLocale, type Locale, type MediaKind, type PageKey,
} from './config'

/** Langue active de l'application, normalisée. */
export const activeLocale = (): Locale => {
  const current = i18n.global.locale.value
  return isLocale(current) ? current : DEFAULT_LOCALE
}

/**
 * Chemin canonique d'une page fixe dans la langue active.
 * Utilisé par tous les liens internes : un lien qui pointe déjà sur l'URL
 * canonique évite une redirection, ce qui préserve le budget de crawl.
 */
export const localePath = (key: PageKey, locale: Locale = activeLocale()): string =>
  `/${locale}/${PAGE_SEGMENTS[key][locale]}`

/** Chemin canonique de l'accueil dans la langue active. */
export const localeHome = (locale: Locale = activeLocale()): string => `/${locale}`

/** Chemin canonique d'une œuvre dans la langue active. */
export const localeMedia = (
  kind: MediaKind,
  slug: string,
  locale: Locale = activeLocale()
): string => `/${locale}/${MEDIA_SEGMENTS[kind][locale]}/${slug}`

/** Anciens chemins en dur qu'il faut continuer à reconnaître. */
const LEGACY_ALIASES: Partial<Record<PageKey, string[]>> = {
  discovery: ['discovery'],
  library: ['list'],
  login: ['login'],
  register: ['register'],
  profile: ['profile'],
  supportedSites: ['supported-sites'],
  officialPartners: ['official-partners'],
  changelog: ['changelog'],
  terms: ['terms'],
  privacy: ['privacy'],
}

/**
 * Réécrit un chemin hérité (`/pricing`, `/manga/one-piece`, `/list`…) vers sa
 * forme canonique localisée. Sert de filet pour les redirections du router et
 * pour les `router.push` qui n'ont pas encore été migrés.
 *
 * Renvoie `null` si le chemin n'est pas reconnu, pour laisser le 404 faire son travail.
 */
export function canonicalizePath(path: string, locale: Locale = activeLocale()): string | null {
  // On isole la query string et le fragment pour les réattacher tels quels au
  // chemin réécrit (`?q=naruto` ne doit pas être perdu par la redirection).
  const cut = path.search(/[?#]/)
  const pathname = cut === -1 ? path : path.slice(0, cut)
  const suffix = cut === -1 ? '' : path.slice(cut)

  const segments = pathname.split('/').filter(Boolean)

  // Un éventuel préfixe de langue déjà présent prime sur la langue active :
  // un visiteur qui ouvre /de/... doit rester en allemand.
  let targetLocale = locale
  if (segments.length && isLocale(segments[0])) {
    targetLocale = segments[0]
    segments.shift()
  }

  if (segments.length === 0) return `${localeHome(targetLocale)}${suffix}`

  // Ancienne page d'accueil
  if (segments.length === 1 && segments[0] === 'home') {
    return `${localeHome(targetLocale)}${suffix}`
  }

  // Page œuvre : /<segment>/<slug>
  if (segments.length === 2) {
    const kind = SEGMENT_TO_KIND[segments[0].toLowerCase()]
    if (kind) return `${localeMedia(kind, segments[1], targetLocale)}${suffix}`
  }

  // Page fixe : on cherche à quelle page correspond le segment, quelle que soit
  // la langue dans laquelle il est écrit.
  if (segments.length === 1) {
    const segment = segments[0].toLowerCase()
    for (const key of Object.keys(PAGE_SEGMENTS) as PageKey[]) {
      const known = [...LOCALES.map(l => PAGE_SEGMENTS[key][l]), ...LEGACY_ALIASES[key] ?? []]
      if (known.includes(segment)) return `${localePath(key, targetLocale)}${suffix}`
    }
  }

  return null
}

/**
 * URL équivalente de la route courante dans une autre langue.
 *
 * Le sélecteur de langue doit *naviguer*, pas seulement changer une variable :
 * si l'utilisateur passe en allemand et reste sur `/fr/tarifs`, l'URL ment sur
 * son contenu et Google finit par indexer la mauvaise langue sous la mauvaise URL.
 */
export function switchLocalePath(
  route: {
    params: Record<string, unknown>
    meta: { pageKey?: PageKey; mediaKind?: MediaKind }
    query?: Record<string, unknown>
    hash?: string
  },
  locale: Locale
): string {
  const suffix = (route.hash as string) || ''

  if (route.meta.pageKey) return `${localePath(route.meta.pageKey, locale)}${suffix}`

  if (route.meta.mediaKind) {
    const slug = String(route.params.name ?? '')
    if (slug) return `${localeMedia(route.meta.mediaKind, slug, locale)}${suffix}`
  }

  return `${localeHome(locale)}${suffix}`
}

/**
 * Expose les helpers dans les templates : `$lp('pricing')`, `$lhome()`,
 * `$lmedia('lecture', slug)`.
 */
export const localePathPlugin = {
  install(app: App) {
    app.config.globalProperties.$lp = (key: PageKey) => localePath(key)
    app.config.globalProperties.$lhome = () => localeHome()
    app.config.globalProperties.$lmedia = (kind: MediaKind, slug: string) => localeMedia(kind, slug)
  },
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $lp: (key: PageKey) => string
    $lhome: () => string
    $lmedia: (kind: MediaKind, slug: string) => string
  }
}
