import { QueryTypes } from 'sequelize';
import { sequelize, createSocialNotification } from './database.js';

// Regle unique de confidentialite : mon activite est a moi. Celle d'un autre
// compte n'est lisible que s'il a rendu son profil public. L'amitie donne acces
// a l'identite (pseudo, avatar, demande), jamais a l'activite.
const canSeeActivity = (viewer, target, targetIsPublic) => viewer === target || targetIsPublic === true;

const fail = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Journal d'activité alimenté par la bibliothèque. Volontairement tolérant :
// un fil d'actualité ne doit jamais faire échouer l'action qui l'a déclenché.
async function recordActivity(username, idLibrary, type, detail = null) {
    try {
        await sequelize.query(
            `INSERT INTO "Activity" (name_client, id_library, type, detail, created_at)
             VALUES (:username, :idLibrary, :type, :detail, NOW())`,
            { replacements: { username, idLibrary, type, detail }, type: QueryTypes.INSERT }
        );
    } catch (err) {
        console.error('❌ Activité non enregistrée:', err.message);
    }
}

// Un profil privé reste trouvable et peut recevoir une demande d'ami : c'est son
// activité qui est masquée, pas son existence. Sans cela le bouton « Ajouter »
// n'était jamais atteignable pour ces comptes, et `is_public` vaut false par défaut.
async function searchProfiles(query, viewer) {
    const term = String(query ?? '').trim();
    if (term.length < 2) return [];

    return sequelize.query(
        `SELECT
            c.name                                  AS username,
            c.avatar_url                            AS "avatarUrl",
            c.is_public                             AS "isPublic",
            CASE WHEN c.is_public
                 THEN (SELECT COUNT(*) FROM libraryusage lu WHERE lu.name_client = c.name)::int
                 ELSE NULL
            END                                     AS "worksTracked",
            COALESCE(f.status, 'none')              AS "friendStatus"
         FROM "Client" c
         LEFT JOIN "Friendship" f ON f.name_client = :viewer AND f.name_friend = c.name
         WHERE c.name ILIKE :term AND c.name <> :viewer
         ORDER BY c.name ASC
         LIMIT 20`,
        { replacements: { term: `%${term}%`, viewer }, type: QueryTypes.SELECT }
    );
}

async function getFriendStatus(username, other) {
    const rows = await sequelize.query(
        'SELECT status FROM "Friendship" WHERE name_client = :username AND name_friend = :other LIMIT 1',
        { replacements: { username, other }, type: QueryTypes.SELECT }
    );
    return rows[0]?.status ?? 'none';
}

async function getPublicProfile(target, viewer) {
    const rows = await sequelize.query(
        `SELECT c.name AS username, c.avatar_url AS "avatarUrl", c.banner_url AS "bannerUrl", c.is_public AS "isPublic"
         FROM "Client" c WHERE c.name = :target LIMIT 1`,
        { replacements: { target }, type: QueryTypes.SELECT }
    );

    if (rows.length === 0) throw fail('Profil introuvable', 404);

    const profile = rows[0];
    const friendStatus = viewer === target ? 'self' : await getFriendStatus(viewer, target);

    // Un profil privé n'est visible que de son propriétaire et de ses amis acceptés.
    if (!profile.isPublic && friendStatus !== 'self' && friendStatus !== 'accepted') {
        throw fail('Profil introuvable', 404);
    }

    // Être ami d'un compte privé donne accès à son identité, pas à son activité.
    // On n'exécute alors même pas les deux requêtes qui la produisent.
    if (!canSeeActivity(viewer, target, profile.isPublic)) {
        return {
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            bannerUrl: profile.bannerUrl,
            isPublic: profile.isPublic,
            friendStatus,
            worksTracked: null,
            averageScore: null,
            activity: [],
            activityHidden: true,
        };
    }

    const [summary] = await sequelize.query(
        `SELECT COUNT(*)::int AS "worksTracked", ROUND(AVG(score), 2) AS "averageScore"
         FROM libraryusage WHERE name_client = :target`,
        { replacements: { target }, type: QueryTypes.SELECT }
    );

    const recent = await sequelize.query(
        `SELECT a.type, a.detail, a.created_at AS "createdAt", l.id AS "idLibrary", l.name AS title, lt.type AS "mediaType"
         FROM "Activity" a
         JOIN "Library" l ON l.id = a.id_library
         LEFT JOIN "LibrarySource" ls ON ls.id_library = l.id
         LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
         WHERE a.name_client = :target
         ORDER BY a.created_at DESC
         LIMIT 20`,
        { replacements: { target }, type: QueryTypes.SELECT }
    );

    return {
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        bannerUrl: profile.bannerUrl,
        isPublic: profile.isPublic,
        friendStatus,
        worksTracked: summary?.worksTracked ?? 0,
        averageScore: summary?.averageScore === null ? null : Number(summary?.averageScore),
        activity: dedupeActivity(recent),
        activityHidden: false,
    };
}

// Une progression chapitre par chapitre produirait un fil illisible : on ne garde
// que l'événement le plus récent par œuvre et par type.
function dedupeActivity(rows) {
    const seen = new Set();
    return rows.filter(row => {
        const key = `${row.idLibrary}:${row.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function listFriends(username) {
    const rows = await sequelize.query(
        `SELECT f.name_friend AS username, f.status, c.avatar_url AS "avatarUrl",
                c.is_public AS "isPublic",
                CASE WHEN c.is_public
                     THEN (SELECT COUNT(*) FROM libraryusage lu WHERE lu.name_client = f.name_friend)::int
                     ELSE NULL
                END AS "worksTracked"
         FROM "Friendship" f
         JOIN "Client" c ON c.name = f.name_friend
         WHERE f.name_client = :username
         ORDER BY f.created_at DESC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    // Les demandes reçues n'ont pas de ligne sortante : on les lit dans l'autre sens.
    const incoming = await sequelize.query(
        `SELECT f.name_client AS username, c.avatar_url AS "avatarUrl"
         FROM "Friendship" f
         JOIN "Client" c ON c.name = f.name_client
         WHERE f.name_friend = :username AND f.status = 'pending'
           AND NOT EXISTS (
               SELECT 1 FROM "Friendship" mine
               WHERE mine.name_client = :username AND mine.name_friend = f.name_client
           )
         ORDER BY f.created_at DESC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    return {
        friends: rows.filter(row => row.status === 'accepted'),
        sent: rows.filter(row => row.status === 'pending'),
        received: incoming,
    };
}

async function requestFriend(username, target) {
    if (username === target) throw fail('Impossible de s\'ajouter soi-même', 400);

    const [exists] = await sequelize.query(
        'SELECT 1 AS ok FROM "Client" WHERE name = :target LIMIT 1',
        { replacements: { target }, type: QueryTypes.SELECT }
    );
    if (!exists) throw fail('Profil introuvable', 404);

    // Demande croisée : les deux se sont invités, on valide directement.
    const reverse = await getFriendStatus(target, username);

    await sequelize.query(
        `INSERT INTO "Friendship" (name_client, name_friend, status, created_at)
         VALUES (:username, :target, :status, NOW())
         ON CONFLICT (name_client, name_friend) DO UPDATE SET status = EXCLUDED.status`,
        {
            replacements: { username, target, status: reverse === 'pending' ? 'accepted' : 'pending' },
            type: QueryTypes.INSERT,
        }
    );

    if (reverse === 'pending') {
        await sequelize.query(
            `UPDATE "Friendship" SET status = 'accepted' WHERE name_client = :target AND name_friend = :username`,
            { replacements: { username, target }, type: QueryTypes.UPDATE }
        );
        // L'autre avait déjà invité : de son point de vue, sa demande vient d'être acceptée.
        await createSocialNotification(target, username, 'friend_accepted');
        return 'accepted';
    }

    // Sans cette notification, la demande n'est visible qu'en se rendant soi-même
    // sur la page Communauté.
    await createSocialNotification(target, username, 'friend_request');
    return 'pending';
}

async function acceptFriend(username, requester) {
    const status = await getFriendStatus(requester, username);
    if (status !== 'pending') throw fail('Aucune demande en attente de ce profil', 404);

    await sequelize.query(
        `UPDATE "Friendship" SET status = 'accepted' WHERE name_client = :requester AND name_friend = :username`,
        { replacements: { username, requester }, type: QueryTypes.UPDATE }
    );

    await sequelize.query(
        `INSERT INTO "Friendship" (name_client, name_friend, status, created_at)
         VALUES (:username, :requester, 'accepted', NOW())
         ON CONFLICT (name_client, name_friend) DO UPDATE SET status = 'accepted'`,
        { replacements: { username, requester }, type: QueryTypes.INSERT }
    );

    await createSocialNotification(requester, username, 'friend_accepted');
}

// Retirer un ami coupe la relation des deux côtés : elle n'a pas de sens à sens unique.
async function removeFriend(username, other) {
    await sequelize.query(
        `DELETE FROM "Friendship"
         WHERE (name_client = :username AND name_friend = :other)
            OR (name_client = :other AND name_friend = :username)`,
        { replacements: { username, other }, type: QueryTypes.DELETE }
    );
}

// Le fil est volontairement borné : au-delà, il n'est plus lu et la requête
// grossit avec le nombre d'amis. FEED_LIMIT fait foi, y compris si le client
// demande davantage.
const FEED_LIMIT = 50;

async function getFriendFeed(username, { limit = FEED_LIMIT } = {}) {
    const capped = Math.min(Math.max(Number.parseInt(limit, 10) || FEED_LIMIT, 1), FEED_LIMIT);
    const rows = await sequelize.query(
        `SELECT a.name_client AS username, a.type, a.detail, a.created_at AS "createdAt",
                c.avatar_url AS "avatarUrl",
                l.id AS "idLibrary", l.name AS title, lt.type AS "mediaType"
         FROM "Activity" a
         JOIN "Friendship" f ON f.name_friend = a.name_client
                            AND f.name_client = :username
                            AND f.status = 'accepted'
         JOIN "Client" c ON c.name = a.name_client
         JOIN "Library" l ON l.id = a.id_library
         LEFT JOIN "LibrarySource" ls ON ls.id_library = l.id
         LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
         WHERE c.is_public
         ORDER BY a.created_at DESC
         LIMIT :limit`,
        { replacements: { username, limit: capped }, type: QueryTypes.SELECT }
    );

    return rows;
}

async function setProfileVisibility(username, isPublic) {
    await sequelize.query(
        'UPDATE "Client" SET is_public = :isPublic WHERE name = :username',
        { replacements: { username, isPublic }, type: QueryTypes.UPDATE }
    );
    return { isPublic };
}

export {
    FEED_LIMIT,
    canSeeActivity,
    recordActivity,
    searchProfiles,
    getPublicProfile,
    listFriends,
    requestFriend,
    acceptFriend,
    removeFriend,
    getFriendFeed,
    setProfileVisibility,
};
