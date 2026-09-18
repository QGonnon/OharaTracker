import { DEFAULT_LOCALE } from './seoRoutes.js';
import { LOCALES } from './seoRoutes.js';

// Échappement XML : un titre contenant `&` ou `<` casserait le sitemap.
export const xmlSanitize = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Une entrée <url> avec ses alternates hreflang pour chaque langue.
export const urlEntry = ({ pathFor, lastmod, changefreq, priority }) => LOCALES.map(locale => {
    const alternates = [
        ...LOCALES.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlSanitize(abs(pathFor(l)))}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlSanitize(abs(pathFor(DEFAULT_LOCALE)))}"/>`,
    ].join('\n');

    return [
        '  <url>',
        `    <loc>${xmlSanitize(abs(pathFor(locale)))}</loc>`,
        lastmod ? `    <lastmod>${xmlSanitize(lastmod)}</lastmod>` : null,
        changefreq ? `    <changefreq>${xmlSanitize(changefreq)}</changefreq>` : null,
        priority ? `    <priority>${xmlSanitize(priority)}</priority>` : null,
        alternates,
        '  </url>',
    ].filter(Boolean).join('\n');
}).join('\n');

export const urlset = body => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;

export const sendXml = (res, body) => {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=600, s-maxage=3600');
    res.send(body);
};

export const abs = path => `${siteUrl()}${path}`;

export const siteUrl = () => (process.env.SITE_URL).replace(/\/+$/, '');
