import type { App } from 'vue'
import i18n from '../i18n'
import {
  DEFAULT_LOCALE, LOCALES, MEDIA_SEGMENTS, PAGE_SEGMENTS, SEGMENT_TO_KIND,
  isLocale, type Locale, type MediaKind, type PageKey,
} from './config'

export const activeLocale = (): Locale => {
  const current = i18n.global.locale.value
  return isLocale(current) ? current : DEFAULT_LOCALE
}

export const localePath = (key: PageKey, locale: Locale = activeLocale()): string =>
  `/${locale}/${PAGE_SEGMENTS[key][locale]}`

export const localeHome = (locale: Locale = activeLocale()): string => `/${locale}`

export const localeMedia = (
  kind: MediaKind,
  slug: string,
  locale: Locale = activeLocale()
): string => `/${locale}/${MEDIA_SEGMENTS[kind][locale]}/${slug}`

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

// Réécrit un chemin hérité vers sa forme canonique localisée ; renvoie null si non reconnu (404).
export function canonicalizePath(path: string, locale: Locale = activeLocale()): string | null {
  const cut = path.search(/[?#]/)
  const pathname = cut === -1 ? path : path.slice(0, cut)
  const suffix = cut === -1 ? '' : path.slice(cut)

  const segments = pathname.split('/').filter(Boolean)

  // Un préfixe de langue déjà présent prime sur la langue active.
  let targetLocale = locale
  if (segments.length && isLocale(segments[0])) {
    targetLocale = segments[0]
    segments.shift()
  }

  if (segments.length === 0) return `${localeHome(targetLocale)}${suffix}`

  if (segments.length === 1 && segments[0] === 'home') {
    return `${localeHome(targetLocale)}${suffix}`
  }

  if (segments.length === 2) {
    const kind = SEGMENT_TO_KIND[segments[0].toLowerCase()]
    if (kind) return `${localeMedia(kind, segments[1], targetLocale)}${suffix}`
  }

  if (segments.length === 1) {
    const segment = segments[0].toLowerCase()
    for (const key of Object.keys(PAGE_SEGMENTS) as PageKey[]) {
      const known = [...LOCALES.map(l => PAGE_SEGMENTS[key][l]), ...LEGACY_ALIASES[key] ?? []]
      if (known.includes(segment)) return `${localePath(key, targetLocale)}${suffix}`
    }
  }

  return null
}

// Le sélecteur de langue doit naviguer, pas juste changer une variable, sinon l'URL
// mentirait sur son contenu (Google indexerait la mauvaise langue sous la mauvaise URL).
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
