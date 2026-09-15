import { MEDIA_SEGMENTS, PAGE_SEGMENTS } from './routeTranslations.js';
import { urlset, urlEntry, abs } from './xml.js';

 const LOCALES = ['fr', 'en', 'de', 'it', 'es'];
 const DEFAULT_LOCALE = 'en';

 { MEDIA_SEGMENTS, PAGE_SEGMENTS };

// Pages de compte (connexion, profil...) volontairement absentes : elles sont en noindex.
 const INDEXABLE_PAGES = [
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

const PRIVATE_PAGE_KEYS = ['login', 'register', 'profile', 'library', 'notifications'];

const CHUNK = 10000; // max URL par fichier sitemap (limite du protocole : 50 000)


async function homePath(locale) {
    return `/${locale}`;
}

async function pagePath(key, locale) {
    return `/${locale}/${PAGE_SEGMENTS[key][locale]}`;
}

async function mediaPath(kind, slug, locale) {
    return `/${locale}/${MEDIA_SEGMENTS[kind][locale]}/${encodeURIComponent(slug)}`;
}

async function sitemap(callback) {
    try {
            const catalog = await getCatalogForSitemap();
            const perChunk = Math.floor(CHUNK / LOCALES.length);
            const chunks = Math.max(1, Math.ceil(catalog.length / perChunk));
    
            const entries = [
                '  <sitemap><loc>' + xml(abs('/sitemap-pages.xml')) + '</loc></sitemap>',
                ...Array.from({ length: chunks }, (_, i) =>
                    `  <sitemap><loc>${xml(abs(`/sitemap-media-${i + 1}.xml`))}</loc></sitemap>`),
            ].join('\n');
            
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${entries}
    </sitemapindex>
    `;
            return callback(null, xml);
    } catch (err) {
        callback(err);
    }
}

function sitemapPages(callback) {
    try{
        const body = [
            urlEntry({ pathFor: homePath, changefreq: 'daily', priority: '1.0' }),
            ...INDEXABLE_PAGES.map(page => urlEntry({
                pathFor: locale => pagePath(page.key, locale),
                changefreq: page.changefreq,
                priority: page.priority,
            })),
        ].join('\n');
        callback(null, urlset(body));
    } catch (err) {
        callback(err);
    }
}

async function sitemapMedia(chunkParam, callback) {
    try {
        const chunk = parseInt(chunkParam, 10);
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

        callback(null, urlset(body));
    } catch (err) {
        callback(err);
    }
}

function robotsTxt(callback) {
    try{
        if (process.env.NODE_ENV !== 'production') {
            const body = 'User-agent: *\nDisallow: /\n'
            callback(null, body);
            return;
        }
    
        const privatePaths = PRIVATE_PAGE_KEYS.flatMap(key =>
            LOCALES.map(locale => `Disallow: /${locale}/${PAGE_SEGMENTS[key][locale]}`)
        );
    
        const body = [
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
        ].join('\n')
        callback(null, body);
    }
    catch (err) {
        callback(err);
    }
}

export {
    LOCALES, DEFAULT_LOCALE, INDEXABLE_PAGES, PAGE_SEGMENTS, PRIVATE_PAGE_KEYS,
    homePath, pagePath, mediaPath, sitemap, sitemapPages, sitemapMedia, robotsTxt,
}

