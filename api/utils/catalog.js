import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';
import { slugCandidates, slugify, resolveMediaKind } from './slug.js';

/**
 * Vue légère du catalogue : une ligne par œuvre, sans ses chapitres.
 *
 * `GET /chapters` renvoie l'intégralité des chapitres de toutes les sources pour
 * toutes les œuvres — plusieurs mégaoctets. Les écrans qui n'affichent que des
 * vignettes (découverte, recherche, œuvres similaires) n'ont besoin que de ceci,
 * ce qui change radicalement le temps de chargement, donc les Core Web Vitals,
 * donc le classement.
 */
export async function getCatalogLight() {
    return sequelize.query(
        `SELECT
            l.id                        AS id,
            l.name                      AS title,
            lt.type                     AS type,
            l.author                    AS author,
            l.artist                    AS artist,
            l.theme                     AS theme,
            l.status                    AS status,
            l.description               AS description,
            l.cover_path                AS "coverPath",
            l.cover_url                 AS "coverUrl",
            MAX(lc.created_at)          AS "updatedAt",
            COUNT(DISTINCT lc.chapter)  AS "chapterCount"
         FROM "Library" l
         LEFT JOIN "LibrarySource" ls ON ls.id_library = l.id
         LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
         LEFT JOIN "Chapters" lc ON lc.id_library = l.id
         GROUP BY l.id, l.name, lt.type, l.author, l.artist, l.theme,
                  l.status, l.description, l.cover_path, l.cover_url
         ORDER BY MAX(lc.created_at) DESC NULLS LAST, l.name ASC`,
        { type: QueryTypes.SELECT }
    );
}

/**
 * Toutes les œuvres sous la forme attendue par le sitemap et le rendu serveur
 * des métadonnées : slug canonique, nature, date de dernière mise à jour.
 */
export async function getCatalogForSitemap() {
    const rows = await getCatalogLight();
    return rows
        .filter(row => row.title && slugify(row.title))
        .map(row => ({
            id: row.id,
            title: row.title,
            slug: slugify(row.title),
            kind: resolveMediaKind(row.type),
            // `lastmod` = date du chapitre le plus récent : c'est ce qui dit à Google
            // qu'il vaut la peine de recrawler la page.
            lastmod: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
            description: row.description,
            theme: row.theme,
            author: row.author,
            artist: row.artist,
            status: row.status,
            coverPath: row.coverPath,
            coverUrl: row.coverUrl,
            chapterCount: Number(row.chapterCount ?? 0),
        }));
}

/**
 * Une œuvre et ses chapitres, résolue depuis son slug d'URL.
 *
 * Le slug n'existe pas en base (il est dérivé du titre) : on résout donc en deux
 * temps — la vue légère pour trouver l'identifiant, puis le détail de cette seule
 * œuvre. Renvoie aussi `canonicalSlug` pour que l'appelant puisse rediriger si
 * l'URL utilisait l'ancienne forme du slug.
 */
export async function getWorkBySlug(slug) {
    const wanted = String(slug ?? '').toLowerCase();
    if (!wanted) return null;

    const catalog = await getCatalogLight();
    const match = catalog.find(row =>
        row.title && slugCandidates(row.title).some(candidate => candidate.toLowerCase() === wanted)
    );
    if (!match) return null;

    const chapters = await sequelize.query(
        `SELECT
            s.name      AS site,
            ls.url      AS "mangaUrl",
            lc.chapter  AS chapter,
            lc.url      AS url,
            lc.created_at AS "createdAt"
         FROM "Chapters" lc
         JOIN "Source" s ON lc.id_source = s.id_source
         JOIN "LibrarySource" ls ON lc.id_library = ls.id_library AND lc.id_source = ls.id_source
         WHERE lc.id_library = :idLibrary
         ORDER BY lc.created_at DESC, lc.chapter DESC`,
        { replacements: { idLibrary: match.id }, type: QueryTypes.SELECT }
    );

    // Regroupement par source, même forme que `GET /chapters` pour que le
    // frontend puisse consommer les deux endpoints sans code spécifique.
    const sites = {};
    for (const row of chapters) {
        if (!sites[row.site]) {
            sites[row.site] = { site: row.site, mangaUrl: row.mangaUrl, chapters: [] };
        }
        sites[row.site].chapters.push({
            chapter: row.chapter,
            url: row.url,
            chapterUrl: row.url,
            site: row.site,
        });
    }

    return {
        id: match.id,
        title: match.title,
        type: match.type,
        kind: resolveMediaKind(match.type),
        canonicalSlug: slugify(match.title),
        author: match.author,
        artist: match.artist,
        theme: match.theme,
        status: match.status,
        description: match.description,
        coverPath: match.coverPath,
        coverUrl: match.coverUrl,
        updatedAt: match.updatedAt,
        sites,
    };
}
