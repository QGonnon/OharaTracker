import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { getWorkBySlug } from '../utils/catalog.js';
import { slugify } from '../utils/slug.js';
import {
    renderHead, resolvePath, negotiateLocale, isPrivatePage, t, tRaw, translationsAvailable,
    LOCALES, DEFAULT_LOCALE, SITE_NAME, siteUrl, abs,
    homePath, pagePath, mediaPath,
} from './head.js';
import { INDEXABLE_PAGES } from '../utils/seoRoutes.js';
import { renderPreloads } from './preload.js';

const DIST = path.resolve(process.cwd(), '../frontend/dist');
const INDEX = path.join(DIST, 'index.html');

const SCHEMA_TYPE = { lecture: 'ComicSeries', serie: 'TVSeries', film: 'Movie' };

const ORG_ID = () => `${siteUrl()}/#organization`;

const coverUrl = work => {
    if (work.coverPath) return abs(`/cdn/${work.coverPath}`);
    if (work.coverUrl) return work.coverUrl;
    return null;
};

// Réplique côté serveur le JSON-LD FAQPage que le client pose via useSeo, pour les
// crawlers qui n'exécutent pas JS. Seule la FAQ est concernée : son contenu est
// entièrement disponible dans les traductions (contrairement aux prix, calculés côté client).
function pageSpecificJsonLd(pageKey, locale) {
    if (pageKey !== 'faq') return [];

    const items = tRaw(locale, 'faq.items');
    if (!Array.isArray(items)) return [];

    return [{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(item => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
    }];
}

const breadcrumb = (locale, trail) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: abs(item.path),
    })),
});

// Sert l'app compilée en injectant les balises SEO par requête, pour les crawlers
// qui n'exécutent pas JS ; gère aussi les vrais codes 301/404 qu'une SPA ne peut pas émettre.
export function createSpaMiddleware() {
    if (!fs.existsSync(INDEX)) {
        console.warn(`⚠️  SEO : ${INDEX} introuvable — le rendu serveur des métadonnées est désactivé.`);
        console.warn('   Lancez `npm run build` dans frontend/ pour l\'activer.');
        return null;
    }
    if (!translationsAvailable()) {
        console.warn('⚠️  SEO : fichiers de traduction introuvables — titres et descriptions non traduits.');
    }

    const router = express.Router();

    // En dev on relit le fichier à chaque requête pour éviter de redémarrer l'API après un rebuild.
    const cachedTemplate = process.env.NODE_ENV === 'production'
        ? fs.readFileSync(INDEX, 'utf8')
        : null;
    const template = () => cachedTemplate ?? fs.readFileSync(INDEX, 'utf8');

    router.use('/assets', express.static(path.join(DIST, 'assets'), {
        immutable: true,
        maxAge: '1y',
    }));

    // index: false pour que la racine passe par la logique SEO ci-dessous.
    router.use(express.static(DIST, { index: false, maxAge: '1h' }));

    router.get(/.*/, async (req, res, next) => {
        if (!req.accepts('html') || req.method !== 'GET') return next();

        try {
            const page = await describe(req);

            if (page.redirect) {
                // 301 (permanent) : transfère l'autorité SEO de l'ancienne URL vers la nouvelle.
                return res.redirect(301, page.redirect);
            }

            const html = injectHead(template(), {
                ...page,
                nonce: res.locals.cspNonce,
                preloads: page.preloads ?? '',
            });

            res.status(page.status || 200);
            res.set('Content-Type', 'text/html; charset=utf-8');
            res.set('Cache-Control', page.status === 404
                ? 'no-store'
                : 'public, max-age=0, s-maxage=300');
            res.send(html);
        } catch (err) {
            console.error('❌ SEO middleware :', err);
            next(err);
        }
    });

    return router;
}

// Remplace les métadonnées de repli d'index.html (sinon chaque page servirait un <title> en double).
function injectHead(template, page) {
    const preloads = page.preloads ? `    ${page.preloads}\n` : '';
    return template
        .replace(/[ \t]*<title>[\s\S]*?<\/title>\s*/i, '')
        .replace(/[ \t]*<meta\s+name="description"[\s\S]*?>\s*/i, '')
        .replace('</head>', `${preloads}    ${renderHead(page)}\n  </head>`)
        .replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${page.locale}"`);
}

async function describe(req) {
    const resolved = resolvePath(req.path, req.headers['accept-language']);
    const { locale } = resolved;

    // Une URL sans préfixe de langue n'est pas canonique : on redirige.
    if (!resolved.localeInPath && resolved.kind !== 'unknown') {
        const target = canonicalPath(resolved, negotiateLocale(req.headers['accept-language']));
        if (target) return { redirect: target + queryOf(req) };
    }

    if (resolved.kind === 'home') {
        return {
            locale,
            status: 200,
            pathFor: homePath,
            title: t(locale, 'seo.home.title'),
            description: t(locale, 'seo.home.description'),
            jsonLd: [
                {
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    '@id': ORG_ID(),
                    name: SITE_NAME,
                    url: abs(homePath(locale)),
                    logo: { '@type': 'ImageObject', url: abs('/pwa-512.png'), width: 512, height: 512 },
                    description: t(locale, 'seo.home.description'),
                    sameAs: ['https://discord.gg/DfsFuSdDp'],
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    '@id': `${siteUrl()}/#website`,
                    name: SITE_NAME,
                    url: abs(homePath(locale)),
                    inLanguage: locale,
                    publisher: { '@id': ORG_ID() },
                    potentialAction: {
                        '@type': 'SearchAction',
                        target: {
                            '@type': 'EntryPoint',
                            urlTemplate: `${abs(pagePath('search', locale))}?q={search_term_string}`,
                        },
                        'query-input': 'required name=search_term_string',
                    },
                },
            ],
        };
    }

    if (resolved.kind === 'page') {
        const { pageKey } = resolved;
        const noindex = isPrivatePage(pageKey);
        const indexable = INDEXABLE_PAGES.some(p => p.key === pageKey);

        return {
            locale,
            status: 200,
            preloads: renderPreloads(resolved),
            pathFor: l => pagePath(pageKey, l),
            title: t(locale, `seo.${pageKey}.title`),
            description: t(locale, `seo.${pageKey}.description`),
            noindex,
            jsonLd: noindex || !indexable ? [] : [
                ...pageSpecificJsonLd(pageKey, locale),
                breadcrumb(locale, [
                    { name: t(locale, 'seo.breadcrumb.home'), path: homePath(locale) },
                    { name: t(locale, `seo.${pageKey}.title`), path: pagePath(pageKey, locale) },
                ]),
            ],
        };
    }

    if (resolved.kind === 'media') {
        const work = await getWorkBySlug(resolved.slug);
        if (!work) return notFound(locale);

        // La nature en base fait autorité : une série sous /manga/... est redirigée vers
        // /anime/..., ce qui évite le duplicate content entre les anciens segments.
        const canonicalSlug = work.canonicalSlug || slugify(work.title);
        const canonical = mediaPath(work.kind, canonicalSlug, locale);
        if (canonical !== req.path) return { redirect: canonical + queryOf(req) };

        const image = coverUrl(work);
        const genres = String(work.theme ?? '').split(',').map(s => s.trim()).filter(Boolean);
        const people = [work.author, work.artist]
            .filter(name => name && String(name).trim())
            .map(name => ({ '@type': 'Person', name: String(name).trim() }));

        const kindKey = `seo.media.${work.kind}`;
        const description = work.description
            ? truncate(work.description, 155)
            : t(locale, `${kindKey}.description`, { title: work.title });

        return {
            locale,
            status: 200,
            preloads: renderPreloads(resolved),
            pathFor: l => mediaPath(work.kind, canonicalSlug, l),
            title: t(locale, `${kindKey}.title`, { title: work.title }),
            description,
            image,
            ogType: 'article',
            jsonLd: [
                {
                    '@context': 'https://schema.org',
                    '@type': SCHEMA_TYPE[work.kind],
                    name: work.title,
                    url: abs(mediaPath(work.kind, canonicalSlug, locale)),
                    inLanguage: locale,
                    ...(work.description ? { description: work.description } : {}),
                    ...(image ? { image } : {}),
                    ...(genres.length ? { genre: genres } : {}),
                    ...(people.length ? { author: people } : {}),
                },
                breadcrumb(locale, [
                    { name: t(locale, 'seo.breadcrumb.home'), path: homePath(locale) },
                    { name: t(locale, 'seo.discovery.title'), path: pagePath('discovery', locale) },
                    { name: work.title, path: mediaPath(work.kind, canonicalSlug, locale) },
                ]),
            ],
        };
    }

    return notFound(locale);
}

const notFound = locale => ({
    locale,
    status: 404,
    pathFor: homePath,
    title: t(locale, 'errors.not_found.title'),
    description: t(locale, 'errors.not_found.description'),
    noindex: true,
});

const queryOf = req => {
    const i = req.originalUrl.indexOf('?');
    return i === -1 ? '' : req.originalUrl.slice(i);
};

function canonicalPath(resolved, locale) {
    if (resolved.kind === 'home') return homePath(locale);
    if (resolved.kind === 'page') return pagePath(resolved.pageKey, locale);
    if (resolved.kind === 'media') return mediaPath(resolved.mediaKind, resolved.slug, locale);
    return null;
}

function truncate(text, max) {
    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max);
    return cut.slice(0, cut.lastIndexOf(' ')).trimEnd() + '…';
}

export { LOCALES, DEFAULT_LOCALE };
