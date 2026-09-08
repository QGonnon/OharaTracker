import fs from 'node:fs';
import path from 'node:path';
import {
    LOCALES, DEFAULT_LOCALE, MEDIA_SEGMENTS, PAGE_SEGMENTS, PRIVATE_PAGE_KEYS,
    homePath, pagePath, mediaPath,
} from '../utils/seoRoutes.js';

const SITE_NAME = 'Ohara Tracker';

const OG_LOCALE = { fr: 'fr_FR', en: 'en_US', de: 'de_DE', it: 'it_IT', es: 'es_ES' };

export const siteUrl = () =>
    (process.env.SITE_URL || process.env.APP_URL || 'https://oharatracker.com').replace(/\/+$/, '');

const abs = p => `${siteUrl()}${p}`;

/** Échappement pour insertion dans un attribut ou un nœud texte HTML. */
const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Échappement pour insertion dans un <script type="application/ld+json">. */
const escJson = obj => JSON.stringify(obj).replace(/</g, '\\u003c');

// ---------------------------------------------------------------------------
// Traductions
// ---------------------------------------------------------------------------

const LOCALES_DIR = path.resolve(process.cwd(), '../frontend/src/locales');

/**
 * Les mêmes fichiers de traduction que le frontend, lus au démarrage.
 *
 * Le titre et la description rendus par le serveur doivent être identiques à
 * ceux que l'application posera ensuite côté client : les dupliquer ici en dur
 * garantirait qu'ils divergent un jour, et Google verrait alors un contenu
 * différent de l'utilisateur.
 */
const messages = (() => {
    const loaded = {};
    for (const locale of LOCALES) {
        try {
            loaded[locale] = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${locale}.json`), 'utf8'));
        } catch {
            loaded[locale] = null;
        }
    }
    return loaded;
})();

export const translationsAvailable = () => LOCALES.some(l => messages[l] !== null);

/** Résout une clé pointée (`seo.home.title`) avec repli sur la langue par défaut. */
export function t(locale, key, params = {}) {
    const lookup = (loc) => key.split('.').reduce((acc, part) => acc?.[part], messages[loc]);
    const raw = lookup(locale) ?? lookup(DEFAULT_LOCALE);
    if (typeof raw !== 'string') return '';
    return raw.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

// ---------------------------------------------------------------------------
// Construction du <head>
// ---------------------------------------------------------------------------

/**
 * Sérialise les balises SEO d'une page.
 *
 * @param {object} input
 * @param {string} input.locale
 * @param {(locale: string) => string} input.pathFor  chemin de la page dans une langue donnée
 * @param {string} input.title        titre sans le nom du site
 * @param {string} input.description
 * @param {string} [input.image]      URL absolue de l'image de partage
 * @param {boolean} [input.noindex]
 * @param {string} [input.ogType]
 * @param {object[]} [input.jsonLd]
 * @param {string} [input.nonce]  nonce CSP à porter sur les blocs JSON-LD
 */
export function renderHead(input) {
    const { locale, pathFor, description, image, noindex, jsonLd = [], nonce } = input;
    const canonical = abs(pathFor(locale));
    const title = input.title?.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`;
    // Bannière 1200×630 dans la langue de la page, générée par
    // `npm run og:image` côté frontend. Doit rester aligné sur
    // `defaultOgImage` dans frontend/src/seo/useSeo.ts.
    const ogImage = image || abs(`/og-default-${locale}.png`);

    const tags = [
        `<title>${esc(title)}</title>`,
        `<meta name="description" content="${esc(description)}">`,
        `<link rel="canonical" href="${esc(canonical)}">`,
        `<meta name="robots" content="${noindex
            ? 'noindex, nofollow'
            : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}">`,
    ];

    if (!noindex) {
        for (const l of LOCALES) {
            tags.push(`<link rel="alternate" hreflang="${l}" href="${esc(abs(pathFor(l)))}">`);
        }
        tags.push(`<link rel="alternate" hreflang="x-default" href="${esc(abs(pathFor(DEFAULT_LOCALE)))}">`);
    }

    tags.push(
        `<meta property="og:site_name" content="${esc(SITE_NAME)}">`,
        `<meta property="og:type" content="${esc(input.ogType || 'website')}">`,
        `<meta property="og:title" content="${esc(title)}">`,
        `<meta property="og:description" content="${esc(description)}">`,
        `<meta property="og:url" content="${esc(canonical)}">`,
        `<meta property="og:image" content="${esc(ogImage)}">`,
        `<meta property="og:locale" content="${esc(OG_LOCALE[locale] || OG_LOCALE[DEFAULT_LOCALE])}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${esc(title)}">`,
        `<meta name="twitter:description" content="${esc(description)}">`,
        `<meta name="twitter:image" content="${esc(ogImage)}">`,
    );

    if (nonce) {
        // Permet au code client (unhead) de réutiliser le même nonce quand il
        // repose les balises lors d'une navigation interne.
        tags.push(`<meta name="csp-nonce" content="${esc(nonce)}">`);
    }

    // Sans nonce, une CSP stricte bloque ces blocs et fait disparaître les
    // rich results : l'attribut n'est donc pas optionnel en production.
    const nonceAttr = nonce ? ` nonce="${esc(nonce)}"` : '';
    for (const block of jsonLd) {
        tags.push(`<script type="application/ld+json"${nonceAttr}>${escJson(block)}</script>`);
    }

    return tags.join('\n    ');
}

// ---------------------------------------------------------------------------
// Résolution d'une URL entrante
// ---------------------------------------------------------------------------

const SEGMENT_TO_KIND = {};
for (const [kind, byLocale] of Object.entries(MEDIA_SEGMENTS)) {
    for (const segment of Object.values(byLocale)) SEGMENT_TO_KIND[segment] = kind;
}
// Anciens segments, encore présents dans des liens partagés
Object.assign(SEGMENT_TO_KIND, { lecture: 'lecture', serie: 'serie', anime: 'serie', manga: 'lecture' });

const SEGMENT_TO_PAGE = {};
for (const [key, byLocale] of Object.entries(PAGE_SEGMENTS)) {
    for (const segment of Object.values(byLocale)) SEGMENT_TO_PAGE[segment] = key;
}

/**
 * Analyse un chemin et dit de quelle page il s'agit.
 *
 * @returns {{kind:'home'|'page'|'media'|'unknown', locale:string, localeInPath:boolean,
 *            pageKey?:string, mediaKind?:string, slug?:string}}
 */
export function resolvePath(pathname, acceptLanguage = '') {
    const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);

    let locale = null;
    if (segments.length && LOCALES.includes(segments[0])) {
        locale = segments.shift();
    }
    const localeInPath = locale !== null;
    if (!locale) locale = negotiateLocale(acceptLanguage);

    if (segments.length === 0) return { kind: 'home', locale, localeInPath };

    if (segments.length === 1) {
        const pageKey = SEGMENT_TO_PAGE[segments[0].toLowerCase()];
        if (pageKey) return { kind: 'page', locale, localeInPath, pageKey };
        if (segments[0].toLowerCase() === 'home') return { kind: 'home', locale, localeInPath };
    }

    if (segments.length === 2) {
        const mediaKind = SEGMENT_TO_KIND[segments[0].toLowerCase()];
        if (mediaKind) return { kind: 'media', locale, localeInPath, mediaKind, slug: segments[1] };
    }

    return { kind: 'unknown', locale, localeInPath };
}

/** Langue déduite de l'en-tête `Accept-Language`, pour la racine du site. */
export function negotiateLocale(acceptLanguage = '') {
    const ranked = String(acceptLanguage)
        .split(',')
        .map(part => {
            const [tag, q] = part.trim().split(';q=');
            return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
        })
        .filter(entry => entry.tag)
        .sort((a, b) => b.q - a.q);

    for (const { tag } of ranked) {
        const short = tag.split('-')[0];
        if (LOCALES.includes(short)) return short;
    }
    return DEFAULT_LOCALE;
}

export const isPrivatePage = pageKey => PRIVATE_PAGE_KEYS.includes(pageKey);

export { LOCALES, DEFAULT_LOCALE, SITE_NAME, abs, esc, homePath, pagePath, mediaPath };
