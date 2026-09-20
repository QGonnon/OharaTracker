import crypto from 'node:crypto';
import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

const fail = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// 22 caractères base64url ≈ 128 bits : non devinable, et tient dans une URL courte.
const newShareToken = () => crypto.randomBytes(16).toString('base64url').slice(0, 22);

const WORKS_QUERY = `
    SELECT
        i.id_watchlist  AS "idWatchlist",
        l.id            AS "idLibrary",
        l.name          AS title,
        l.cover_path    AS "coverPath",
        l.cover_url     AS "coverUrl",
        lt.type         AS type,
        i.position      AS position
    FROM "WatchlistItem" i
    JOIN "Library" l ON l.id = i.id_library
    LEFT JOIN "LibrarySource" ls ON ls.id_library = l.id
    LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
    WHERE i.id_watchlist IN (:ids)
    ORDER BY i.position ASC, l.name ASC`;

async function attachWorks(lists) {
    if (lists.length === 0) return lists;

    const rows = await sequelize.query(WORKS_QUERY, {
        replacements: { ids: lists.map(list => list.id) },
        type: QueryTypes.SELECT,
    });

    const byList = new Map(lists.map(list => [list.id, { ...list, works: [] }]));
    for (const row of rows) {
        // Une œuvre reliée à plusieurs sources ressort plusieurs fois : on ne garde que la première.
        const list = byList.get(row.idWatchlist);
        if (list && !list.works.some(work => work.idLibrary === row.idLibrary)) {
            list.works.push({
                idLibrary: row.idLibrary,
                title: row.title,
                coverPath: row.coverPath,
                coverUrl: row.coverUrl,
                type: row.type,
            });
        }
    }

    return [...byList.values()];
}

async function getOwnedWatchlists(username) {
    const lists = await sequelize.query(
        `SELECT w.id, w.title, w.description, w.is_public AS "isPublic", w.share_token AS "shareToken",
                (SELECT COUNT(*) FROM "WatchlistFollower" f WHERE f.id_watchlist = w.id)::int AS "followerCount"
         FROM "Watchlist" w
         WHERE w.name_client = :username
         ORDER BY w.created_at DESC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    return attachWorks(lists);
}

async function getFollowedWatchlists(username) {
    const lists = await sequelize.query(
        `SELECT w.id, w.title, w.description, w.is_public AS "isPublic", w.name_client AS owner,
                (SELECT COUNT(*) FROM "WatchlistFollower" f2 WHERE f2.id_watchlist = w.id)::int AS "followerCount"
         FROM "WatchlistFollower" f
         JOIN "Watchlist" w ON w.id = f.id_watchlist
         WHERE f.name_client = :username
         ORDER BY f.followed_at DESC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    return attachWorks(lists);
}

async function countOwnedWatchlists(username) {
    const rows = await sequelize.query(
        'SELECT COUNT(*)::int AS count FROM "Watchlist" WHERE name_client = :username',
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    return rows[0]?.count ?? 0;
}

async function countFollowedWatchlists(username) {
    const rows = await sequelize.query(
        'SELECT COUNT(*)::int AS count FROM "WatchlistFollower" WHERE name_client = :username',
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    return rows[0]?.count ?? 0;
}

async function createWatchlist(username, { title, description }) {
    const clean = String(title ?? '').trim();
    if (!clean) throw fail('Titre requis', 400);
    if (clean.length > 80) throw fail('Titre trop long (80 caractères maximum)', 400);

    const [rows] = await sequelize.query(
        `INSERT INTO "Watchlist" (name_client, title, description, created_at)
         VALUES (:username, :title, :description, NOW())
         RETURNING id, title, description, is_public AS "isPublic", share_token AS "shareToken"`,
        {
            replacements: { username, title: clean, description: description?.trim() || null },
            type: QueryTypes.INSERT,
        }
    );

    return { ...rows[0], works: [], followerCount: 0 };
}

async function assertOwnership(username, id) {
    const rows = await sequelize.query(
        'SELECT id FROM "Watchlist" WHERE id = :id AND name_client = :username LIMIT 1',
        { replacements: { id, username }, type: QueryTypes.SELECT }
    );
    if (rows.length === 0) throw fail('Liste introuvable', 404);
}

async function deleteWatchlist(username, id) {
    await assertOwnership(username, id);
    await sequelize.query('DELETE FROM "Watchlist" WHERE id = :id', {
        replacements: { id },
        type: QueryTypes.DELETE,
    });
}

// Le partage génère un jeton la première fois ; le retirer coupe l'accès public définitivement.
async function setWatchlistSharing(username, id, isPublic) {
    await assertOwnership(username, id);

    const [rows] = await sequelize.query(
        `UPDATE "Watchlist"
         SET is_public = :isPublic,
             share_token = CASE WHEN :isPublic THEN COALESCE(share_token, :token) ELSE NULL END
         WHERE id = :id
         RETURNING id, is_public AS "isPublic", share_token AS "shareToken"`,
        { replacements: { id, isPublic, token: newShareToken() }, type: QueryTypes.UPDATE }
    );

    return rows[0];
}

async function addWorkToWatchlist(username, id, idLibrary) {
    await assertOwnership(username, id);

    await sequelize.query(
        `INSERT INTO "WatchlistItem" (id_watchlist, id_library, position)
         VALUES (:id, :idLibrary, COALESCE((SELECT MAX(position) + 1 FROM "WatchlistItem" WHERE id_watchlist = :id), 0))
         ON CONFLICT DO NOTHING`,
        { replacements: { id, idLibrary }, type: QueryTypes.INSERT }
    );
}

async function removeWorkFromWatchlist(username, id, idLibrary) {
    await assertOwnership(username, id);

    await sequelize.query(
        'DELETE FROM "WatchlistItem" WHERE id_watchlist = :id AND id_library = :idLibrary',
        { replacements: { id, idLibrary }, type: QueryTypes.DELETE }
    );
}

// Lecture publique par jeton : ne révèle jamais l'identifiant interne de la liste.
async function getWatchlistByToken(token) {
    const lists = await sequelize.query(
        `SELECT w.id, w.title, w.description, w.name_client AS owner,
                (SELECT COUNT(*) FROM "WatchlistFollower" f WHERE f.id_watchlist = w.id)::int AS "followerCount"
         FROM "Watchlist" w
         WHERE w.share_token = :token AND w.is_public = true
         LIMIT 1`,
        { replacements: { token }, type: QueryTypes.SELECT }
    );

    if (lists.length === 0) throw fail('Liste introuvable', 404);
    const [list] = await attachWorks(lists);
    return list;
}

async function followWatchlistByToken(username, token) {
    const list = await getWatchlistByToken(token);
    if (list.owner === username) throw fail('Vous êtes déjà propriétaire de cette liste', 409);

    await sequelize.query(
        `INSERT INTO "WatchlistFollower" (id_watchlist, name_client, followed_at)
         VALUES (:id, :username, NOW())
         ON CONFLICT DO NOTHING`,
        { replacements: { id: list.id, username }, type: QueryTypes.INSERT }
    );

    return list;
}

async function unfollowWatchlist(username, id) {
    await sequelize.query(
        'DELETE FROM "WatchlistFollower" WHERE id_watchlist = :id AND name_client = :username',
        { replacements: { id, username }, type: QueryTypes.DELETE }
    );
}

export {
    getOwnedWatchlists,
    getFollowedWatchlists,
    countOwnedWatchlists,
    countFollowedWatchlists,
    createWatchlist,
    deleteWatchlist,
    setWatchlistSharing,
    addWorkToWatchlist,
    removeWorkFromWatchlist,
    getWatchlistByToken,
    followWatchlistByToken,
    unfollowWatchlist,
};
