// Configuration SEO centrale.
//
// Un seul endroit décide : quelles langues existent, à quoi ressemble une URL
// canonique, et quels segments d'URL sont utilisés dans chaque langue. Le router,
// le composable `useSeo`, le sitemap et le middleware serveur lisent tous ça,
// pour qu'il soit impossible d'avoir un canonical qui diverge d'un lien interne.

export const LOCALES = ['fr', 'en', 'de', 'it', 'es'] as const
export type Locale = (typeof LOCALES)[number]

/** Langue servie sur `x-default` (celle qu'on montre à un visiteur dont la langue n'est pas couverte). */
export const DEFAULT_LOCALE: Locale = 'en'

/** Code `hreflang` complet envoyé à Google pour chaque langue. */
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

// ---------------------------------------------------------------------------
// Origine du site
// ---------------------------------------------------------------------------

/**
 * Origine absolue du site (sans slash final), obligatoire pour les balises
 * canonical / hreflang / og:url qui n'acceptent pas d'URL relative.
 * En prod on la fige via VITE_SITE_URL ; en dev on retombe sur l'origine courante.
 */
export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://oharatracker.com')
).replace(/\/+$/, '')

export const SITE_NAME = 'Ohara Tracker'

/** Compte Twitter/X officiel — `null` tant qu'il n'existe pas (mieux que pointer un handle bidon). */
export const TWITTER_HANDLE: string | null = null

/** Profils officiels, utilisés dans le `sameAs` du JSON-LD Organization. */
export const SOCIAL_PROFILES = ['https://discord.gg/DfsFuSdDp']

// ---------------------------------------------------------------------------
// Segments d'URL localisés
// ---------------------------------------------------------------------------

/**
 * Les trois natures d'œuvre du produit (`MediaKind` côté store) et le segment
 * d'URL utilisé pour chacune, langue par langue.
 *
 * "manga" et "anime" sont des emprunts japonais employés tels quels dans les 5
 * langues : on garde le même segment partout, c'est le terme le plus recherché.
 * Seul "film" varie réellement (movie / película).
 */
export const MEDIA_SEGMENTS = {
  lecture: { fr: 'manga', en: 'manga', de: 'manga', it: 'manga', es: 'manga' },
  serie: { fr: 'anime', en: 'anime', de: 'anime', it: 'anime', es: 'anime' },
  film: { fr: 'film', en: 'movie', de: 'film', it: 'film', es: 'pelicula' },
} as const satisfies Record<string, Record<Locale, string>>

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

/**
 * Segments des pages fixes, langue par langue. Une URL dans la langue de
 * l'utilisateur se positionne mieux qu'un segment anglais universel, et ça ne
 * coûte qu'une table : le router accepte tous les alias, le canonical n'en garde qu'un.
 */
export const PAGE_SEGMENTS = {
  discovery: { fr: 'decouverte', en: 'discover', de: 'entdecken', it: 'scopri', es: 'descubrir' },
  search: { fr: 'recherche', en: 'search', de: 'suche', it: 'ricerca', es: 'busqueda' },
  pricing: { fr: 'tarifs', en: 'pricing', de: 'preise', it: 'prezzi', es: 'precios' },
  blog: { fr: 'blog', en: 'blog', de: 'blog', it: 'blog', es: 'blog' },
  status: { fr: 'statut', en: 'status', de: 'status', it: 'stato', es: 'estado' },
  changelog: { fr: 'nouveautes', en: 'changelog', de: 'changelog', it: 'novita', es: 'novedades' },
  suggestions: { fr: 'suggestions', en: 'suggestions', de: 'vorschlaege', it: 'suggerimenti', es: 'sugerencias' },
  supportedSites: {
    fr: 'sites-supportes', en: 'supported-sites', de: 'unterstuetzte-seiten',
    it: 'siti-supportati', es: 'sitios-compatibles',
  },
  officialPartners: {
    fr: 'partenaires-officiels', en: 'official-partners', de: 'offizielle-partner',
    it: 'partner-ufficiali', es: 'socios-oficiales',
  },
  contact: { fr: 'contact', en: 'contact', de: 'kontakt', it: 'contatti', es: 'contacto' },
  terms: { fr: 'conditions-utilisation', en: 'terms', de: 'nutzungsbedingungen', it: 'termini', es: 'terminos' },
  privacy: {
    fr: 'confidentialite', en: 'privacy', de: 'datenschutz',
    it: 'privacy', es: 'privacidad',
  },
  cookies: { fr: 'cookies', en: 'cookies', de: 'cookies', it: 'cookie', es: 'cookies' },
  login: { fr: 'connexion', en: 'login', de: 'anmelden', it: 'accedi', es: 'iniciar-sesion' },
  register: { fr: 'inscription', en: 'register', de: 'registrieren', it: 'registrati', es: 'registro' },
  profile: { fr: 'profil', en: 'profile', de: 'profil', it: 'profilo', es: 'perfil' },
  library: { fr: 'bibliotheque', en: 'library', de: 'bibliothek', it: 'biblioteca', es: 'biblioteca' },
  notifications: {
    fr: 'notifications', en: 'notifications', de: 'benachrichtigungen',
    it: 'notifiche', es: 'notificaciones',
  },
} as const satisfies Record<string, Record<Locale, string>>

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

// ---------------------------------------------------------------------------
// Construction d'URL
// ---------------------------------------------------------------------------

/**
 * Chemin absolu (avec préfixe de langue) d'une page fixe.
 * Toutes les langues sont préfixées, y compris `en` : une seule forme canonique
 * par page et par langue, jamais deux URL pour un même contenu.
 */
export const pagePath = (key: PageKey, locale: Locale): string =>
  `/${locale}/${PAGE_SEGMENTS[key][locale]}`

/** Chemin absolu de l'accueil dans une langue. */
export const homePath = (locale: Locale): string => `/${locale}`

/** Chemin absolu d'une œuvre. */
export const mediaPath = (kind: MediaKind, slug: string, locale: Locale): string =>
  `/${locale}/${MEDIA_SEGMENTS[kind][locale]}/${slug}`

/** Transforme un chemin en URL absolue pour canonical / hreflang / og:url. */
export const absoluteUrl = (path: string): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
