import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { getWorkBySlug } from '../utils/catalog.js';
import { slugify } from '../utils/slug.js';
import {
    renderHead, resolvePath, negotiateLocale, isPrivatePage, t, translationsAvailable,
    LOCALES, DEFAULT_LOCALE, SITE_NAME, siteUrl, abs,
    homePath, pagePath, mediaPath,
} from './head.js';
import { INDEXABLE_PAGES } from '../utils/seoRoutes.js';
import { renderPreloads } from './preload.js';

const DIST = path.resolve(process.cwd(), '../frontend/dist');
const INDEX = path.join(DIST, 'index.html');

/** Type schema.org le plus précis pour chaque nature d'œuvre. */
const SCHEMA_TYPE = { lecture: 'ComicSeries', serie: 'TVSeries', film: 'Movie' };

const ORG_ID = () => `${siteUrl()}/#organization`;

/** URL absolue de la couverture d'une œuvre, pour l'image de partage. */
const coverUrl = work => {
    if (work.coverPath) return abs(`/cdn/${work.coverPath}`);
    if (work.coverUrl) return work.coverUrl;
    return null;
};

/** Fil d'Ariane commun à toutes les pages profondes. */
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

/**
 * Sert l'application compilée en injectant, à chaque requête, les balises SEO
 * de la page demandée.
 *
 * Sans ça, un robot qui n'exécute pas JavaScript (Bing, les aperçus Discord,
 * WhatsApp, LinkedIn, X…) ne voit qu'une coquille vide avec un titre unique pour
 * toutes les URL. Google finit par exécuter le JS, mais bien plus tard et sans
 * garantie ; ici titre, description, canonical, hreflang, Open Graph et JSON-LD
 * sont déjà présents dans la réponse HTML initiale.
 *
 * Le middleware corrige aussi ce qu'une SPA ne peut pas corriger seule :
 * les vrais codes 301 et 404, que le routeur client ne peut pas émettre.
 */
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

    // En production le HTML est lu une fois ; en dev on relit à chaque requête
    // pour ne pas avoir à redémarrer l'API après un rebuild du frontend.
    const cachedTemplate = process.env.NODE_ENV === 'production'
        ? fs.readFileSync(INDEX, 'utf8')
        : null;
    const template = () => cachedTemplate ?? fs.readFileSync(INDEX, 'utf8');

    // Les assets versionnés (hash dans le nom) peuvent être mis en cache un an :
    // c'est ce qui fait passer les visites répétées de « lent » à « instantané ».
    router.use('/assets', express.static(path.join(DIST, 'assets'), {
        immutable: true,
        maxAge: '1y',
    }));

    // Le reste des fichiers statiques (icônes, manifeste, service worker).
    // `index: false` pour que la racine passe par la logique SEO ci-dessous.
    router.use(express.static(DIST, { index: false, maxAge: '1h' }));

    router.get(/.*/, async (req, res, next) => {
        // On ne traite que les navigations : les requêtes d'API ou d'assets
        // manquants doivent continuer leur chemin normalement.
        if (!req.accepts('html') || req.method !== 'GET') return next();

        try {
            const page = await describe(req);

            if (page.redirect) {
                // 301 et non 302 : la forme canonique est définitive, et c'est ce
                // qui transfère l'autorité de l'ancienne URL vers la nouvelle.
                return res.redirect(301, page.redirect);
            }

            const html = injectHead(template(), {
                ...page,
                nonce: res.locals.cspNonce,
                preloads: page.preloads ?? '',
            });

            res.status(page.status || 200);
            res.set('Content-Type', 'text/html; charset=utf-8');
            // Le HTML porte des données de catalogue : court cache partagé, jamais privé.
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

/**
 * Remplace les métadonnées de repli d'`index.html` par celles de la page.
 *
 * Le template en contient déjà (pour le cas où ce middleware n'est pas actif) :
 * si on se contentait d'ajouter les nôtres, chaque page servirait deux `<title>`
 * et deux `<meta name="description">`. Google n'en retient qu'un, arbitrairement,
 * et les outils d'audit signalent la page comme mal formée.
 */
function injectHead(template, page) {
    const preloads = page.preloads ? `    ${page.preloads}\n` : '';
    return template
        .replace(/[ \t]*<title>[\s\S]*?<\/title>\s*/i, '')
        .replace(/[ \t]*<meta\s+name="description"[\s\S]*?>\s*/i, '')
        .replace('</head>', `${preloads}    ${renderHead(page)}\n  </head>`)
        .replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${page.locale}"`);
}

/**
 * Décrit la page demandée : quelles métadonnées poser, quel statut HTTP renvoyer,
 * ou vers quelle URL rediriger.
 */
async function describe(req) {
    const resolved = resolvePath(req.path, req.headers['accept-language']);
    const { locale } = resolved;

    // Une URL sans préfixe de langue n'est pas canonique : on redirige, sinon le
    // même contenu resterait accessible sous deux adresses.
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
                breadcrumb(locale, [
                    { name: t(locale, 'seo.breadcrumb.home'), path: homePath(locale) },
                    { name: t(locale, `seo.${pageKey}.title`), path: pagePath(pageKey, locale) },
                ]),
            ],
        };
    }

    if (resolved.kind === 'media') {
        const work = await getWorkBySlug(resolved.slug);

        // Œuvre inconnue : vraie 404, jamais une redirection vers l'accueil.
        if (!work) return notFound(locale);

        // La nature en base fait autorité sur le segment emprunté : une série
        // demandée sous `/manga/...` est redirigée vers `/anime/...`, ce qui
        // supprime le duplicate content entre les cinq anciens segments.
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

/** Chemin canonique correspondant à une URL résolue sans préfixe de langue. */
function canonicalPath(resolved, locale) {
    if (resolved.kind === 'home') return homePath(locale);
    if (resolved.kind === 'page') return pagePath(resolved.pageKey, locale);
    if (resolved.kind === 'media') return mediaPath(resolved.mediaKind, resolved.slug, locale);
    return null;
}

/** Coupe une description au dernier mot entier, pour ne pas tronquer en plein mot. */
function truncate(text, max) {
    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max);
    return cut.slice(0, cut.lastIndexOf(' ')).trimEnd() + '…';
}

export { LOCALES, DEFAULT_LOCALE };
