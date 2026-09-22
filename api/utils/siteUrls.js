import { PAGE_SEGMENTS, normalizeLocale } from './routeTranslations.js';

// SITE_URL est saisi à la main dans .env : il peut finir par un ou plusieurs '/'.
// Les concaténer avec un chemin produirait `https://site//tarifs`, que le routeur
// front ne reconnaît pas (il affiche sa page 404). On normalise donc une fois ici.
const siteOrigin = () => String(process.env.SITE_URL ?? '').replace(/\/+$/, '');

/** URL absolue d'un chemin interne, sans double slash. */
const absoluteUrl = (path = '/') => `${siteOrigin()}/${String(path).replace(/^\/+/, '')}`;

/**
 * URL absolue d'une page, dans la langue demandée.
 * Les routes du site sont préfixées par la locale et traduites (`/fr/tarifs`,
 * `/en/pricing`) : une URL codée en dur comme `/pricing` n'existe pas.
 */
const pageUrl = (key, locale) => {
    const lang = normalizeLocale(locale);
    return absoluteUrl(`${lang}/${PAGE_SEGMENTS[key][lang]}`);
};

export { siteOrigin, absoluteUrl, pageUrl };
