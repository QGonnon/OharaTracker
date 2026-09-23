import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';
import { slugify, resolveMediaKind } from './slug.js';
import { publicAverage } from './score.js';

const WORKS_LIMIT = 20;

// Classement des œuvres : agrégat anonyme, aucune donnée personnelle exposée.
async function getWorksLeaderboard({ limit = WORKS_LIMIT } = {}) {
    const rows = await sequelize.query(
        `SELECT l.id, l.name AS title, lt.type AS type,
                l.cover_path AS "coverPath", l.cover_url AS "coverUrl",
                COUNT(DISTINCT lu.name_client)::int AS followers,
                ROUND(AVG(lu.score), 1) AS "averageScore",
                COUNT(lu.score)::int AS "ratingCount"
         FROM "Library" l
         JOIN libraryusage lu ON lu.id_library = l.id
         LEFT JOIN "LibrarySource" ls ON ls.id_library = l.id
         LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
         GROUP BY l.id, l.name, lt.type, l.cover_path, l.cover_url
         ORDER BY followers DESC, "averageScore" DESC NULLS LAST, l.name ASC
         LIMIT :limit`,
        { replacements: { limit }, type: QueryTypes.SELECT }
    );

    return rows
        .filter(row => row.title && slugify(row.title))
        .map(row => ({
            title: row.title,
            slug: slugify(row.title),
            kind: resolveMediaKind(row.type),
            coverPath: row.coverPath,
            coverUrl: row.coverUrl,
            followers: row.followers,
            // Même seuil que la fiche d'une œuvre : une moyenne calculée sur trop
            // peu de votes ne doit pas non plus servir à classer.
            ...publicAverage(row.averageScore, row.ratingCount),
        }));
}

// Classement entre amis : un palmarès global exposerait l'activité de comptes
// qui ne l'ont pas choisi, alors que l'amitié est déjà un consentement mutuel.
async function getFriendsLeaderboard(username) {
    const rows = await sequelize.query(
        `WITH circle AS (
            SELECT :username AS name
            UNION
            -- Meme regle que le fil d'actualite : un ami au profil prive ne
            -- figure pas au classement, qui expose des chiffres d'activite.
            SELECT f.name_friend FROM "Friendship" f
            JOIN "Client" c ON c.name = f.name_friend
            WHERE f.name_client = :username AND f.status = 'accepted' AND c.is_public
        )
        SELECT c.name AS username,
               cl.avatar_url AS "avatarUrl",
               COUNT(lu.id_library)::int AS "worksTracked",
               COUNT(lu.id_library) FILTER (WHERE lu.reading_status = 'Terminé')::int AS completed,
               ROUND(AVG(lu.score), 2) AS "averageScore"
        FROM circle c
        JOIN "Client" cl ON cl.name = c.name
        LEFT JOIN libraryusage lu ON lu.name_client = c.name
        GROUP BY c.name, cl.avatar_url
        ORDER BY "worksTracked" DESC, completed DESC, c.name ASC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    return rows.map((row, index) => ({
        rank: index + 1,
        username: row.username,
        avatarUrl: row.avatarUrl,
        worksTracked: row.worksTracked,
        completed: row.completed,
        averageScore: row.averageScore === null ? null : Number(row.averageScore),
        isMe: row.username === username,
    }));
}

export { getWorksLeaderboard, getFriendsLeaderboard };
