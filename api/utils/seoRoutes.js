// Miroir de `frontend/src/seo/config.ts`.
//
// Le sitemap et le rendu serveur des métadonnées doivent produire exactement les
// mêmes URL que le router du frontend. Toute modification des segments ici doit
// être répercutée là-bas (et inversement) — `npm run seo:check` à la racine de
// `api/` vérifie que les deux tables concordent.

export const LOCALES = ['fr', 'en', 'de', 'it', 'es'];
export const DEFAULT_LOCALE = 'en';

export const MEDIA_SEGMENTS = {
    lecture: { fr: 'manga', en: 'manga', de: 'manga', it: 'manga', es: 'manga' },
    serie: { fr: 'anime', en: 'anime', de: 'anime', it: 'anime', es: 'anime' },
    film: { fr: 'film', en: 'movie', de: 'film', it: 'film', es: 'pelicula' },
};

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
    privacy: { fr: 'confidentialite', en: 'privacy', de: 'datenschutz', it: 'privacy', es: 'privacidad' },
    cookies: { fr: 'cookies', en: 'cookies', de: 'cookies', it: 'cookie', es: 'cookies' },
    login: { fr: 'connexion', en: 'login', de: 'anmelden', it: 'accedi', es: 'iniciar-sesion' },
    register: { fr: 'inscription', en: 'register', de: 'registrieren', it: 'registrati', es: 'registro' },
    profile: { fr: 'profil', en: 'profile', de: 'profil', it: 'profilo', es: 'perfil' },
    library: { fr: 'bibliotheque', en: 'library', de: 'bibliothek', it: 'biblioteca', es: 'biblioteca' },
    notifications: {
        fr: 'notifications', en: 'notifications', de: 'benachrichtigungen',
        it: 'notifiche', es: 'notificaciones',
    },
};

/**
 * Pages publiques à faire figurer dans le sitemap, avec leur priorité relative.
 * Les pages de compte (connexion, profil, bibliothèque…) en sont volontairement
 * absentes : elles sont en `noindex`, les lister enverrait un signal contradictoire.
 */
export const INDEXABLE_PAGES = [
    { key: 'discovery', priority: '0.9', changefreq: 'daily' },
    { key: 'search', priority: '0.7', changefreq: 'weekly' },
    { key: 'pricing', priority: '0.8', changefreq: 'monthly' },
    { key: 'blog', priority: '0.7', changefreq: 'weekly' },
    { key: 'supportedSites', priority: '0.6', changefreq: 'weekly' },
    { key: 'officialPartners', priority: '0.5', changefreq: 'monthly' },
    { key: 'changelog', priority: '0.5', changefreq: 'weekly' },
    { key: 'suggestions', priority: '0.4', changefreq: 'monthly' },
    { key: 'status', priority: '0.3', changefreq: 'weekly' },
    { key: 'contact', priority: '0.4', changefreq: 'yearly' },
    { key: 'terms', priority: '0.2', changefreq: 'yearly' },
    { key: 'privacy', priority: '0.2', changefreq: 'yearly' },
    { key: 'cookies', priority: '0.2', changefreq: 'yearly' },
];

/** Chemins jamais indexables, quel que soit le préfixe de langue. */
export const PRIVATE_PAGE_KEYS = ['login', 'register', 'profile', 'library', 'notifications'];

export const homePath = locale => `/${locale}`;
export const pagePath = (key, locale) => `/${locale}/${PAGE_SEGMENTS[key][locale]}`;
export const mediaPath = (kind, slug, locale) =>
    `/${locale}/${MEDIA_SEGMENTS[kind][locale]}/${encodeURIComponent(slug)}`;
