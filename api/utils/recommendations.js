import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';
import { slugify, resolveMediaKind } from './slug.js';
import { SCORE_NEUTRAL } from './score.js';

const DEFAULT_LIMIT = 12;

// Deux profils de goût. `simple` compte les genres suivis ; `weighted` pondère par la
// note donnée et dévalue les genres des œuvres abandonnées. C'est la nuance qui
// sépare les suggestions de l'offre Lite des recommandations de l'offre Pro.
const PROFILE_WEIGHTS = {
    simple: '1',
    weighted: `CASE lu.reading_status
                    WHEN 'Abandonné' THEN -1
                    WHEN 'Terminé'   THEN 1.5
                    ELSE 1
               END * COALESCE(lu.score, ${SCORE_NEUTRAL}) / ${SCORE_NEUTRAL}`,
};

async function getRecommendations(username, { mode = 'simple', limit = DEFAULT_LIMIT, kind = null } = {}) {
    const weight = PROFILE_WEIGHTS[mode] ?? PROFILE_WEIGHTS.simple;

    const rows = await sequelize.query(
        `WITH taste AS (
            SELECT t.name AS genre, SUM(${weight}) AS weight
            FROM libraryusage lu
            JOIN "Tag" t ON t.id_library = lu.id_library
            WHERE lu.name_client = :username AND t.name IS NOT NULL
            GROUP BY t.name
            HAVING SUM(${weight}) > 0
        ),
        popularity AS (
            SELECT id_library, COUNT(DISTINCT name_client)::int AS followers
            FROM libraryusage
            GROUP BY id_library
        )
        SELECT
            l.id                                   AS id,
            l.name                                 AS title,
            l.description                          AS description,
            l.cover_path                           AS "coverPath",
            l.cover_url                            AS "coverUrl",
            lt.type                                AS type,
            COALESCE(p.followers, 0)               AS followers,
            ROUND(SUM(ta.weight)::numeric, 2)      AS affinity,
            ARRAY_AGG(DISTINCT t.name)             AS genres
        FROM "Library" l
        JOIN "Tag" t ON t.id_library = l.id
        JOIN taste ta ON ta.genre = t.name
        LEFT JOIN popularity p ON p.id_library = l.id
        LEFT JOIN "LibrarySource" ls ON ls.id_library = l.id
        LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
        WHERE NOT EXISTS (
            SELECT 1 FROM libraryusage mine
            WHERE mine.id_library = l.id AND mine.name_client = :username
        )
        AND (:kind::text IS NULL OR lt.type = :kind)
        GROUP BY l.id, l.name, l.description, l.cover_path, l.cover_url, lt.type, p.followers
        ORDER BY SUM(ta.weight) DESC, COALESCE(p.followers, 0) DESC, l.name ASC
        LIMIT :limit`,
        { replacements: { username, limit, kind }, type: QueryTypes.SELECT }
    );

    return rows
        .filter(row => row.title && slugify(row.title))
        .map(row => ({
            id: row.id,
            title: row.title,
            slug: slugify(row.title),
            kind: resolveMediaKind(row.type),
            type: row.type,
            description: row.description,
            coverPath: row.coverPath,
            coverUrl: row.coverUrl,
            followers: row.followers,
            affinity: Number(row.affinity),
            // Les genres qui ont déclenché la suggestion : c'est ce qui la rend explicable.
            genres: (row.genres ?? []).filter(Boolean).slice(0, 3),
        }));
}

// Repli quand l'utilisateur n'a encore rien suivi : les œuvres les plus suivies.
async function getPopularWorks({ limit = DEFAULT_LIMIT } = {}) {
    const rows = await sequelize.query(
        `SELECT l.id, l.name AS title, l.description, l.cover_path AS "coverPath", l.cover_url AS "coverUrl",
                lt.type AS type, COUNT(DISTINCT lu.name_client)::int AS followers
         FROM "Library" l
         LEFT JOIN libraryusage lu ON lu.id_library = l.id
         LEFT JOIN "LibrarySource" ls ON ls.id_library = l.id
         LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
         GROUP BY l.id, l.name, l.description, l.cover_path, l.cover_url, lt.type
         ORDER BY followers DESC, l.name ASC
         LIMIT :limit`,
        { replacements: { limit }, type: QueryTypes.SELECT }
    );

    return rows
        .filter(row => row.title && slugify(row.title))
        .map(row => ({
            id: row.id,
            title: row.title,
            slug: slugify(row.title),
            kind: resolveMediaKind(row.type),
            type: row.type,
            description: row.description,
            coverPath: row.coverPath,
            coverUrl: row.coverUrl,
            followers: row.followers,
            affinity: 0,
            genres: [],
        }));
}

export { getRecommendations, getPopularWorks };
