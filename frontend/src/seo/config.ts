// Configuration SEO centrale : langues, URL canoniques et segments, lus par le router,
// useSeo, le sitemap et le middleware serveur, pour qu'aucun canonical ne diverge d'un lien interne.

export const LOCALES = ['fr', 'en', 'de', 'it', 'es'] as const
export type Locale = (typeof LOCALES)[number]

/** Langue servie sur `x-default` (celle qu'on montre à un visiteur dont la langue n'est pas couverte). */
export const DEFAULT_LOCALE: Locale = 'en'

export const HREFLANG: Record<Locale, string> = {
  fr: 'fr',
  en: 'en',
  de: 'de',
  it: 'it',
  es: 'es',
}

/** Valeur de l'attribut `lang` du `<html>` + `og:locale`. */
export const OG_LOCALE: Record<Locale, string> = {
  fr: 'fr_FR',
  en: 'en_US',
  de: 'de_DE',
  it: 'it_IT',
  es: 'es_ES',
}

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

// Fixée via VITE_SITE_URL en prod ; retombe sur l'origine courante en dev.
export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://oharatracker.com')
).replace(/\/+$/, '')

export const SITE_NAME = 'Ohara Tracker'

/** Compte Twitter/X officiel — `null` tant qu'il n'existe pas (mieux que pointer un handle bidon). */
export const TWITTER_HANDLE: string | null = null

export const SOCIAL_PROFILES = ['https://discord.gg/DfsFuSdDp']

export { MEDIA_SEGMENTS, PAGE_SEGMENTS } from './routeTranslations'
import { MEDIA_SEGMENTS, PAGE_SEGMENTS } from './routeTranslations'

export type MediaKind = keyof typeof MEDIA_SEGMENTS

/** Tous les segments acceptés pour une nature donnée (canonique + variantes des autres langues + legacy). */
export const MEDIA_SEGMENT_ALIASES: Record<MediaKind, string[]> = {
  lecture: ['manga', 'lecture', 'manhwa', 'manhua', 'webtoon'],
  serie: ['anime', 'serie', 'series', 'anim'],
  film: ['film', 'movie', 'pelicula', 'peliculas'],
}

/** Segment → nature, pour reconnaître n'importe quelle variante d'URL entrante. */
export const SEGMENT_TO_KIND: Record<string, MediaKind> = Object.fromEntries(
  (Object.keys(MEDIA_SEGMENT_ALIASES) as MediaKind[]).flatMap(kind =>
    MEDIA_SEGMENT_ALIASES[kind].map(segment => [segment, kind] as const)
  )
)

export type PageKey = keyof typeof PAGE_SEGMENTS

/** Toutes les variantes d'un segment de page (les 5 langues + les anciens chemins). */
const LEGACY_PAGE_SEGMENTS: Partial<Record<PageKey, string[]>> = {
  discovery: ['discovery'],
  changelog: ['changelog'],
  supportedSites: ['supported-sites'],
  officialPartners: ['official-partners'],
  terms: ['terms'],
  privacy: ['privacy'],
  login: ['login'],
  register: ['register'],
  profile: ['profile'],
  library: ['list'],
}

export const pageSegmentAliases = (key: PageKey): string[] => {
  const all = [...LOCALES.map(l => PAGE_SEGMENTS[key][l]), ...(LEGACY_PAGE_SEGMENTS[key] ?? [])]
  return [...new Set(all)]
}

// Toutes les langues sont préfixées (y compris en) : une seule forme canonique par page.
export const pagePath = (key: PageKey, locale: Locale): string =>
  `/${locale}/${PAGE_SEGMENTS[key][locale]}`

export const homePath = (locale: Locale): string => `/${locale}`

export const mediaPath = (kind: MediaKind, slug: string, locale: Locale): string =>
  `/${locale}/${MEDIA_SEGMENTS[kind][locale]}/${slug}`

export const absoluteUrl = (path: string): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
