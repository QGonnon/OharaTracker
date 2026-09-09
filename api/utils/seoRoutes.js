// Miroir de frontend/src/seo/config.ts — toute modification doit être répercutée là-bas.

export const LOCALES = ['fr', 'en', 'de', 'it', 'es'];
export const DEFAULT_LOCALE = 'en';

import { MEDIA_SEGMENTS, PAGE_SEGMENTS } from './routeTranslations.js';
export { MEDIA_SEGMENTS, PAGE_SEGMENTS };

// Pages de compte (connexion, profil...) volontairement absentes : elles sont en noindex.
export const INDEXABLE_PAGES = [
    { key: 'discovery', priority: '0.9', changefreq: 'daily' },
    { key: 'search', priority: '0.7', changefreq: 'weekly' },
    { key: 'pricing', priority: '0.8', changefreq: 'monthly' },
    { key: 'blog', priority: '0.7', changefreq: 'weekly' },
    { key: 'faq', priority: '0.7', changefreq: 'monthly' },
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

export const PRIVATE_PAGE_KEYS = ['login', 'register', 'profile', 'library', 'notifications'];

export const homePath = locale => `/${locale}`;
export const pagePath = (key, locale) => `/${locale}/${PAGE_SEGMENTS[key][locale]}`;
export const mediaPath = (kind, slug, locale) =>
    `/${locale}/${MEDIA_SEGMENTS[kind][locale]}/${encodeURIComponent(slug)}`;
