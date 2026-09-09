import express from 'express';
import { getCatalogForSitemap } from '../utils/catalog.js';
import {
    LOCALES, DEFAULT_LOCALE, INDEXABLE_PAGES, PAGE_SEGMENTS, PRIVATE_PAGE_KEYS,
    homePath, pagePath, mediaPath,
} from '../utils/seoRoutes.js';

const router = express.Router();

const siteUrl = () => (process.env.SITE_URL || process.env.APP_URL || 'https://oharatracker.com').replace(/\/+$/, '');

const abs = path => `${siteUrl()}${path}`;

// Échappement XML : un titre contenant `&` ou `<` casserait le sitemap.
const xml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Une entrée <url> avec ses alternates hreflang pour chaque langue.
const urlEntry = ({ pathFor, lastmod, changefreq, priority }) => LOCALES.map(locale => {
    const alternates = [
        ...LOCALES.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${xml(abs(pathFor(l)))}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(abs(pathFor(DEFAULT_LOCALE)))}"/>`,
    ].join('\n');

    return [
        '  <url>',
        `    <loc>${xml(abs(pathFor(locale)))}</loc>`,
        lastmod ? `    <lastmod>${xml(lastmod)}</lastmod>` : null,
        changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
        priority ? `    <priority>${priority}</priority>` : null,
        alternates,
        '  </url>',
    ].filter(Boolean).join('\n');
}).join('\n');

const urlset = body => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;

const sendXml = (res, body) => {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=600, s-maxage=3600');
    res.send(body);
};

const CHUNK = 10000; // max URL par fichier sitemap (limite du protocole : 50 000)

router.get('/sitemap.xml', async (_req, res) => {
    try {
        const catalog = await getCatalogForSitemap();
        const perChunk = Math.floor(CHUNK / LOCALES.length);
        const chunks = Math.max(1, Math.ceil(catalog.length / perChunk));

        const entries = [
            '  <sitemap><loc>' + xml(abs('/sitemap-pages.xml')) + '</loc></sitemap>',
            ...Array.from({ length: chunks }, (_, i) =>
                `  <sitemap><loc>${xml(abs(`/sitemap-media-${i + 1}.xml`))}</loc></sitemap>`),
        ].join('\n');

        sendXml(res, `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/sitemap-pages.xml', (_req, res) => {
    const body = [
        urlEntry({ pathFor: homePath, changefreq: 'daily', priority: '1.0' }),
        ...INDEXABLE_PAGES.map(page => urlEntry({
            pathFor: locale => pagePath(page.key, locale),
            changefreq: page.changefreq,
            priority: page.priority,
        })),
    ].join('\n');

    sendXml(res, urlset(body));
});

router.get('/sitemap-media-:chunk.xml', async (req, res) => {
    try {
        const chunk = parseInt(req.params.chunk, 10);
        if (!Number.isInteger(chunk) || chunk < 1) {
            return res.status(404).json({ error: 'Sitemap introuvable' });
        }

        const catalog = await getCatalogForSitemap();
        const perChunk = Math.floor(CHUNK / LOCALES.length);
        const slice = catalog.slice((chunk - 1) * perChunk, chunk * perChunk);
        if (slice.length === 0) return res.status(404).json({ error: 'Sitemap introuvable' });

        const body = slice.map(work => urlEntry({
            pathFor: locale => mediaPath(work.kind, work.slug, locale),
            lastmod: work.lastmod,
            changefreq: 'weekly',
            priority: '0.8',
        })).join('\n');

        sendXml(res, urlset(body));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Généré (pas statique) car l'URL du sitemap dépend du domaine et le hors-prod doit rester noindex.
router.get('/robots.txt', (_req, res) => {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');

    if (process.env.NODE_ENV !== 'production') {
        res.send('User-agent: *\nDisallow: /\n');
        return;
    }

    const privatePaths = PRIVATE_PAGE_KEYS.flatMap(key =>
        LOCALES.map(locale => `Disallow: /${locale}/${PAGE_SEGMENTS[key][locale]}`)
    );

    res.send([
        'User-agent: *',
        'Allow: /',
        ...privatePaths,
        'Disallow: /auth/',
        'Disallow: /client/',
        'Disallow: /stripe/',
        'Disallow: /notifications/',
        '',
        `Sitemap: ${abs('/sitemap.xml')}`,
        '',
    ].join('\n'));
});

export default router;
