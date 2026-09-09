import type { Locale } from './config'

// "manga" et "anime" sont des emprunts japonais employés tels quels dans les 5 langues ; seul "film" varie.
export const MEDIA_SEGMENTS = {
  lecture: { fr: 'manga', en: 'manga', de: 'manga', it: 'manga', es: 'manga' },
  serie: { fr: 'anime', en: 'anime', de: 'anime', it: 'anime', es: 'anime' },
  film: { fr: 'film', en: 'movie', de: 'film', it: 'film', es: 'pelicula' },
} as const satisfies Record<string, Record<Locale, string>>

export const PAGE_SEGMENTS = {
  discovery: { fr: 'decouverte', en: 'discover', de: 'entdecken', it: 'scopri', es: 'descubrir' },
  search: { fr: 'recherche', en: 'search', de: 'suche', it: 'ricerca', es: 'busqueda' },
  pricing: { fr: 'tarifs', en: 'pricing', de: 'preise', it: 'prezzi', es: 'precios' },
  blog: { fr: 'blog', en: 'blog', de: 'blog', it: 'blog', es: 'blog' },
  faq: { fr: 'faq', en: 'faq', de: 'faq', it: 'faq', es: 'faq' },
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
