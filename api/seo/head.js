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

const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escJson = obj => JSON.stringify(obj).replace(/</g, '\\u003c');

const LOCALES_DIR = path.resolve(process.cwd(), '../frontend/src/locales');

// Lus depuis les mêmes fichiers que le frontend pour garantir un contenu identique SSR/client.
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

const lookupRaw = (locale, key) =>
    key.split('.').reduce((acc, part) => acc?.[part], messages[locale]);

export function t(locale, key, params = {}) {
    const raw = lookupRaw(locale, key) ?? lookupRaw(DEFAULT_LOCALE, key);
    if (typeof raw !== 'string') return '';
    return raw.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

// Renvoie la ressource brute (tableau/objet), ex. faq.items pour le JSON-LD FAQPage.
export function tRaw(locale, key) {
    return lookupRaw(locale, key) ?? lookupRaw(DEFAULT_LOCALE, key);
}

export function renderHead(input) {
    const { locale, pathFor, description, image, noindex, jsonLd = [], nonce } = input;
    const canonical = abs(pathFor(locale));
    const title = input.title?.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`;
    // Doit rester aligné sur `defaultOgImage` dans frontend/src/seo/useSeo.ts.
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
        // Permet à unhead côté client de réutiliser le même nonce sur navigation interne.
        tags.push(`<meta name="csp-nonce" content="${esc(nonce)}">`);
    }

    const nonceAttr = nonce ? ` nonce="${esc(nonce)}"` : '';
    for (const block of jsonLd) {
        tags.push(`<script type="application/ld+json"${nonceAttr}>${escJson(block)}</script>`);
    }

    return tags.join('\n    ');
}

const SEGMENT_TO_KIND = {};
for (const [kind, byLocale] of Object.entries(MEDIA_SEGMENTS)) {
    for (const segment of Object.values(byLocale)) SEGMENT_TO_KIND[segment] = kind;
}
// Anciens segments encore présents dans des liens partagés.
Object.assign(SEGMENT_TO_KIND, { lecture: 'lecture', serie: 'serie', anime: 'serie', manga: 'lecture' });

const SEGMENT_TO_PAGE = {};
for (const [key, byLocale] of Object.entries(PAGE_SEGMENTS)) {
    for (const segment of Object.values(byLocale)) SEGMENT_TO_PAGE[segment] = key;
}

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
