import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

// `last_chapter` porte deux sémantiques : un numéro de chapitre pour la lecture,
// une position "saison.épisode" pour les séries. On ne les additionne donc jamais ensemble.
//
// La comparaison est insensible à la casse : la valeur réellement stockée en base
// est 'ANIME' en majuscules. Une liste ['Anime', 'anime'] ne matchait donc AUCUNE
// ligne — les épisodes étaient comptés comme des chapitres, et « Épisodes vus »
// restait à 0 pour tout le monde.
const IS_ANIME = "UPPER(COALESCE(lt.type, '')) = 'ANIME'";

// `last_chapter` est une colonne texte : une valeur héritée non numérique ferait
// tomber /api/stats en 500 au moment du cast.
const NUMERIC_CHAPTER = "CASE WHEN lu.last_chapter ~ '^[0-9]+(\.[0-9]+)?$' THEN lu.last_chapter::numeric END";

async function getBasicStats(username, { type = null, since = null } = {}) {
    const rows = await sequelize.query(
        `SELECT
            COUNT(*)::int                                          AS "worksTracked",
            COUNT(*) FILTER (WHERE lu.score IS NOT NULL)::int       AS "ratedCount",
            ROUND(AVG(lu.score), 2)                                 AS "averageScore",
            COALESCE(SUM(CASE WHEN NOT ${IS_ANIME} THEN ${NUMERIC_CHAPTER} END), 0) AS "chaptersRead",
            COALESCE(SUM(CASE WHEN ${IS_ANIME} AND SPLIT_PART(lu.last_chapter, '.', 2) ~ '^[0-9]+$'
                              THEN SPLIT_PART(lu.last_chapter, '.', 2)::int END), 0) AS "episodesWatched"
         FROM libraryusage lu
         LEFT JOIN "LibrarySource" ls ON ls.id_library = lu.id_library AND ls.id_source = lu.id_source
         LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
         WHERE lu.name_client = :username
           AND (:type::text IS NULL OR lt.type = :type)`,
        { replacements: { username, type }, type: QueryTypes.SELECT }
    );

    const byStatus = await sequelize.query(
        `SELECT COALESCE(lu.reading_status, 'Sans statut') AS label, COUNT(*)::int AS count
         FROM libraryusage lu
         WHERE lu.name_client = :username
         GROUP BY 1 ORDER BY 2 DESC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    const byType = await sequelize.query(
        `SELECT COALESCE(lt.type, 'Inconnu') AS label, COUNT(*)::int AS count
         FROM libraryusage lu
         LEFT JOIN "LibrarySource" ls ON ls.id_library = lu.id_library AND ls.id_source = lu.id_source
         LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
         WHERE lu.name_client = :username
         GROUP BY 1 ORDER BY 2 DESC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    const summary = rows[0] ?? {};

    return {
        worksTracked: summary.worksTracked ?? 0,
        ratedCount: summary.ratedCount ?? 0,
        averageScore: summary.averageScore === null ? null : Number(summary.averageScore),
        chaptersRead: Math.round(Number(summary.chaptersRead ?? 0)),
        episodesWatched: Number(summary.episodesWatched ?? 0),
        byStatus,
        byType,
    };
}

async function getAdvancedStats(username, { since = null } = {}) {
    const topGenres = await sequelize.query(
        `SELECT t.name AS label, COUNT(DISTINCT lu.id_library)::int AS count
         FROM libraryusage lu
         JOIN "Tag" t ON t.id_library = lu.id_library
         WHERE lu.name_client = :username AND t.name IS NOT NULL
         GROUP BY t.name
         ORDER BY 2 DESC, 1 ASC
         LIMIT 10`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    // Le barème autorise les demi-étoiles : arrondir à l'entier fusionnerait 3 et 3,5
    // dans la même barre et ferait disparaître la moitié des notes possibles.
    const scoreDistributionRows = await sequelize.query(
        `SELECT lu.score AS score, COUNT(*)::int AS count
         FROM libraryusage lu
         WHERE lu.name_client = :username AND lu.score IS NOT NULL
         GROUP BY 1 ORDER BY 1 ASC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    const scoreDistribution = scoreDistributionRows.map(row => ({ score: Number(row.score), count: row.count }));

    // Volume de sorties publiées sur les œuvres suivies : le rythme réel du suivi.
    const monthlyActivity = await sequelize.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', c.created_at), 'YYYY-MM') AS month,
                COUNT(*)::int AS count
         FROM libraryusage lu
         JOIN "Chapters" c ON c.id_library = lu.id_library
         WHERE lu.name_client = :username
           AND c.created_at >= COALESCE(:since::timestamptz, NOW() - INTERVAL '12 months')
         GROUP BY 1 ORDER BY 1 ASC`,
        { replacements: { username, since }, type: QueryTypes.SELECT }
    );

    const topRated = await sequelize.query(
        `SELECT l.name AS title, lu.score AS score
         FROM libraryusage lu
         JOIN "Library" l ON l.id = lu.id_library
         WHERE lu.name_client = :username AND lu.score IS NOT NULL
         ORDER BY lu.score DESC, l.name ASC
         LIMIT 5`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    return {
        topGenres,
        scoreDistribution,
        monthlyActivity,
        topRated: topRated.map(row => ({ title: row.title, score: Number(row.score) })),
    };
}

export { getBasicStats, getAdvancedStats };
