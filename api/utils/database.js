import dotenv from 'dotenv';
import { QueryTypes, Sequelize } from 'sequelize';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

const configPath = path.resolve('sequelize', 'config', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8')).development;

const DB_NAME = process.env.DB_NAME || config.database;
const DB_USER = process.env.DB_USER || config.username;
const DB_PASSWORD = process.env.DB_PASSWORD || config.password;
const rawDbHost = process.env.DB_HOST || config.host;
const [DB_HOST, embeddedPort] = String(rawDbHost).split(':');
const DB_PORT = process.env.DB_PORT || embeddedPort || config.port;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    dialect: 'postgres',
    host: DB_HOST,
    port: DB_PORT,
    logging: false,
});

async function initDb() {
    await sequelize.authenticate();
    await Promise.all([
        initSource('MangaDex'),
        initSource('scan-manga'),
        initSource('AsuraComic'),
    ]);
}

async function initSource(name) {
    const sources = await sequelize.query(
        'SELECT id_source FROM "Source" WHERE name = :name LIMIT 1',
        {
            replacements: { name },
            type: QueryTypes.SELECT,
        }
    );

    if (sources.length > 0) {
        return sources[0].id_source;
    }

    await sequelize.query(
        'INSERT INTO "Source" (name) VALUES (:name)',
        {
            replacements: { name },
            type: QueryTypes.INSERT,
        }
    );

    const created = await sequelize.query(
        'SELECT id_source FROM "Source" WHERE name = :name LIMIT 1',
        {
            replacements: { name },
            type: QueryTypes.SELECT,
        }
    );

    return created[0]?.id_source;
}

async function isLibraryExist(title) {
    const library = await sequelize.query(
        'SELECT id FROM "Library" WHERE name = :title LIMIT 1',
        {
            replacements: { title },
            type: QueryTypes.SELECT,
        }
    );

    return library.length > 0;
}

async function getOrCreateLibrary(mangaInfo) {
    const libraries = await sequelize.query(
        'SELECT id, cover_path, cover_url FROM "Library" WHERE name = :title LIMIT 1',
        {
            replacements: { title: mangaInfo.title },
            type: QueryTypes.SELECT,
        }
    );

    if (libraries.length > 0) {
        return libraries[0];
    }

    await sequelize.query(
        `INSERT INTO "Library" (
            name, description, demographic, published, status,
            artist, author, theme, publishers, cover_path, cover_url
        ) VALUES (
            :title, :description, :demographic, :published, :status,
            :artist, :author, :theme, :publishers, :coverPath, :coverUrl
        )`,
        {
            replacements: {
                title: mangaInfo.title,
                description: mangaInfo.description || null,
                demographic: mangaInfo.demographic || null,
                published: mangaInfo.published || null,
                status: mangaInfo.status || null,
                artist: mangaInfo.artist || null,
                author: mangaInfo.author || null,
                theme: mangaInfo.theme || null,
                publishers: mangaInfo.publishers || null,
                coverPath: mangaInfo.coverPath || null,
                coverUrl: mangaInfo.coverUrl || null,
            },
            type: QueryTypes.INSERT,
        }
    );

    const createdLibraries = await sequelize.query(
        'SELECT id, cover_path, cover_url FROM "Library" WHERE name = :title LIMIT 1',
        {
            replacements: { title: mangaInfo.title },
            type: QueryTypes.SELECT,
        }
    );

    return createdLibraries[0];
}

async function upsertLibraryFromPost({ title, author, theme, status, description, coverPath, coverUrl }) {
    let libraries = await sequelize.query(
        'SELECT id FROM "Library" WHERE name = :title LIMIT 1',
        {
            replacements: { title },
            type: QueryTypes.SELECT,
        }
    );

    if (libraries.length === 0) {
        await sequelize.query(
            `INSERT INTO "Library" (name, author, theme, status, description, cover_path, cover_url)
             VALUES (:title, :author, :theme, :status, :description, :coverPath, :coverUrl)`,
            {
                replacements: {
                    title,
                    author: author || null,
                    theme: theme || null,
                    status: status || null,
                    description: description || null,
                    coverPath: coverPath || null,
                    coverUrl: coverUrl || null,
                },
                type: QueryTypes.INSERT,
            }
        );

        libraries = await sequelize.query(
            'SELECT id FROM "Library" WHERE name = :title LIMIT 1',
            {
                replacements: { title },
                type: QueryTypes.SELECT,
            }
        );
    } else {
        await sequelize.query(
            `UPDATE "Library"
             SET author = COALESCE(:author, author),
                 theme = COALESCE(:theme, theme),
                 status = COALESCE(:status, status),
                 description = COALESCE(:description, description),
                 cover_path = COALESCE(:coverPath, cover_path),
                 cover_url = COALESCE(:coverUrl, cover_url)
             WHERE id = :id`,
            {
                replacements: {
                    author: author || null,
                    theme: theme || null,
                    status: status || null,
                    description: description || null,
                    coverPath: coverPath || null,
                    coverUrl: coverUrl || null,
                    id: libraries[0].id,
                },
                type: QueryTypes.UPDATE,
            }
        );
    }

    return libraries[0];
}

async function getOrCreateLibraryType(type) {
    if (!type) {
        return null;
    }

    const existingTypes = await sequelize.query(
        'SELECT id FROM "LibraryType" WHERE type = :type LIMIT 1',
        {
            replacements: { type },
            type: QueryTypes.SELECT,
        }
    );

    if (existingTypes.length > 0) {
        return existingTypes[0].id;
    }

    await sequelize.query(
        'INSERT INTO "LibraryType" (type) VALUES (:type)',
        {
            replacements: { type },
            type: QueryTypes.INSERT,
        }
    );

    const createdTypes = await sequelize.query(
        'SELECT id FROM "LibraryType" WHERE type = :type LIMIT 1',
        {
            replacements: { type },
            type: QueryTypes.SELECT,
        }
    );

    return createdTypes[0]?.id || null;
}

async function getLibraryByTitleAndSite(title, site) {
    const rows = await sequelize.query(
        `SELECT l.id, ls.id_source
         FROM "Library" l
         LEFT JOIN "LibrarySource" ls ON l.id = ls.id_library
         LEFT JOIN "Source" s ON ls.id_source = s.id_source
         WHERE l.name = :title AND (:site IS NULL OR s.name = :site OR s.name IS NULL)
         ORDER BY ls.id_source
         LIMIT 1`,
        {
            replacements: { title, site: site || null },
            type: QueryTypes.SELECT,
        }
    );

    return rows[0] || null;
}

async function getLibrarySourceByLibraryId(id_library, site) {
    const rows = await sequelize.query(
        `SELECT ls.id_source
         FROM "LibrarySource" ls
         LEFT JOIN "Source" s ON ls.id_source = s.id_source
         WHERE ls.id_library = :id_library AND (:site IS NULL OR s.name = :site)
         ORDER BY ls.id_source
         LIMIT 1`,
        {
            replacements: { id_library, site: site || null },
            type: QueryTypes.SELECT,
        }
    );

    return rows[0] || null;
}

async function addLibraryToUser({
    title,
    author,
    theme,
    status,
    description,
    coverPath,
    coverUrl,
    lastChapter,
    chapterUrl,
    mangaUrl,
    site,
    username,
}) {
    const sourceId = await initSource(site);
    const library = await upsertLibraryFromPost({
        title,
        author,
        theme,
        status,
        description,
        coverPath,
        coverUrl,
    });

    await linkLibrarySource(library.id, sourceId, mangaUrl, null);

    if (lastChapter || chapterUrl) {
        await saveLastChapter(library.id, sourceId, lastChapter, chapterUrl);
    }

    const existing = await sequelize.query(
        'SELECT 1 FROM libraryusage WHERE id_library = :id_library AND name_client = :username AND id_source = :id_source LIMIT 1',
        {
            replacements: { id_library: library.id, username, id_source: sourceId },
            type: QueryTypes.SELECT,
        }
    );

    if (existing.length > 0) {
        return { idLibrary: library.id, duplicate: true };
    }

    await sequelize.query(
        'INSERT INTO libraryusage (id_library, name_client, id_source) VALUES (:id_library, :username, :id_source)',
        {
            replacements: { id_library: library.id, username, id_source: sourceId },
            type: QueryTypes.INSERT,
        }
    );

    return { idLibrary: library.id, duplicate: false };
}

async function isLibraryInUserLibrary({ title, site, username }) {
    const manga = await getLibraryByTitleAndSite(title, site);

    if (!manga) {
        return false;
    }

    const usage = await sequelize.query(
        'SELECT 1 FROM libraryusage WHERE id_library = :id AND name_client = :username AND id_source = :id_source LIMIT 1',
        {
            replacements: { id: manga.id, id_source: manga.id_source, username },
            type: QueryTypes.SELECT,
        }
    );

    return usage.length > 0;
}

async function getUserLibrary(username) {
    return sequelize.query(
        `SELECT DISTINCT ON (l.id)
            l.id,
            l.name AS title,
            l.author,
            l.theme,
            l.status,
            l.description,
            l.cover_path AS "coverPath",
            l.cover_url AS "coverUrl",
            lc.chapter AS "lastChapter",
            lc.url AS "chapterUrl",
            ls.url AS "mangaUrl",
            s.name AS site,
            lu.last_chapter AS "userLastChapter",
            lu.reading_status AS "readingStatus",
            lu.notify_enabled AS "notifyEnabled"
         FROM libraryusage lu
         JOIN "Library" l ON lu.id_library = l.id
         LEFT JOIN "LibrarySource" ls ON l.id = ls.id_library
         LEFT JOIN "Source" s ON ls.id_source = s.id_source
         LEFT JOIN "Chapters" lc ON lc.id_library = l.id AND lc.id_source = ls.id_source
         WHERE lu.name_client = :username
         ORDER BY l.id`,
        {
            replacements: { username },
            type: QueryTypes.SELECT,
        }
    );
}

async function updateUserLibrary({ id, lastChapter, readingStatus, title, site, notifyEnabled, username }) {
    let idLibrary = id;

    if (!idLibrary) {
        if (!title) {
            const error = new Error('id or title requis');
            error.statusCode = 400;
            throw error;
        }

        const manga = await getLibraryByTitleAndSite(title, site);

        if (!manga) {
            const error = new Error('Manga introuvable');
            error.statusCode = 404;
            throw error;
        }

        idLibrary = manga.id;
    }

    const sourceRow = await getLibrarySourceByLibraryId(idLibrary, site);

    if (!sourceRow) {
        const error = new Error('Source introuvable pour ce manga');
        error.statusCode = 404;
        throw error;
    }

    const idSource = sourceRow.id_source;

    const existing = await sequelize.query(
        'SELECT 1 FROM libraryusage WHERE id_library = :id_library AND name_client = :username AND id_source = :id_source LIMIT 1',
        {
            replacements: { id_library: idLibrary, id_source: idSource, username },
            type: QueryTypes.SELECT,
        }
    );

    if (existing.length > 0) {
        await sequelize.query(
            `UPDATE libraryusage
             SET last_chapter = COALESCE(:lastChapter, last_chapter),
                 reading_status = COALESCE(:readingStatus, reading_status),
                 notify_enabled = COALESCE(:notifyEnabled, notify_enabled)
             WHERE id_library = :id_library AND name_client = :username AND id_source = :id_source`,
            {
                replacements: {
                    lastChapter: lastChapter || null,
                    readingStatus: readingStatus || null,
                    notifyEnabled: typeof notifyEnabled === 'boolean' ? notifyEnabled : null,
                    id_library: idLibrary,
                    id_source: idSource,
                    username,
                },
                type: QueryTypes.UPDATE,
            }
        );
    } else {
        await sequelize.query(
            `INSERT INTO libraryusage (id_library, name_client, id_source, last_chapter, reading_status, notify_enabled)
             VALUES (:id_library, :username, :id_source, :lastChapter, :readingStatus, COALESCE(:notifyEnabled, false))`,
            {
                replacements: {
                    id_library: idLibrary,
                    id_source: idSource,
                    username,
                    lastChapter: lastChapter || null,
                    readingStatus: readingStatus || null,
                    notifyEnabled: typeof notifyEnabled === 'boolean' ? notifyEnabled : null,
                },
                type: QueryTypes.INSERT,
            }
        );
    }

    return { idLibrary: idLibrary };
}

async function deleteUserLibrary({ title, site, username }) {
    if (!title) {
        const error = new Error('Title requis');
        error.statusCode = 400;
        throw error;
    }

    const manga = await getLibraryByTitleAndSite(title, site);

    if (!manga) {
        const error = new Error('Manga introuvable dans votre bibliothèque');
        error.statusCode = 404;
        throw error;
    }

    await sequelize.query(
        'DELETE FROM libraryusage WHERE id_library = :id_library AND name_client = :username AND id_source = :id_source',
        {
            replacements: { id_library: manga.id, id_source: manga.id_source, username },
            type: QueryTypes.DELETE,
        }
    );
}

async function getUserNotifications(username, { unreadOnly = false, limit = 50 } = {}) {
    return sequelize.query(
        `SELECT
            n.id,
            n.type,
            n.chapter,
            n.is_read AS "isRead",
            n.created_at AS "createdAt",
            l.id AS "idLibrary",
            l.name AS title,
            l.cover_path AS "coverPath",
            l.cover_url AS "coverUrl",
            lt.type AS "mediaType",
            c.url AS "chapterUrl",
            ls.url AS "mangaUrl",
            s.name AS site
         FROM "Notification" n
         JOIN "Library" l ON l.id = n.id_library
         LEFT JOIN "Chapters" c ON c.id_library = n.id_library AND c.id_source = n.id_source AND c.chapter = n.chapter
         LEFT JOIN "LibrarySource" ls ON ls.id_library = n.id_library AND ls.id_source = n.id_source
         LEFT JOIN "LibraryType" lt ON lt.id = ls.id_library_type
         LEFT JOIN "Source" s ON s.id_source = n.id_source
         WHERE n.name_client = :username ${unreadOnly ? 'AND n.is_read = false' : ''}
         ORDER BY n.created_at DESC
         LIMIT :limit`,
        {
            replacements: { username, limit },
            type: QueryTypes.SELECT,
        }
    );
}

async function getUnreadNotificationCount(username) {
    const rows = await sequelize.query(
        'SELECT COUNT(*)::int AS count FROM "Notification" WHERE name_client = :username AND is_read = false',
        {
            replacements: { username },
            type: QueryTypes.SELECT,
        }
    );
    return rows[0]?.count || 0;
}

async function markNotificationRead(id, username) {
    const result = await sequelize.query(
        'UPDATE "Notification" SET is_read = true WHERE id = :id AND name_client = :username',
        {
            replacements: { id, username },
            type: QueryTypes.UPDATE,
        }
    );
    if (result[1] === 0) {
        const error = new Error('Notification introuvable');
        error.statusCode = 404;
        throw error;
    }
}

async function markAllNotificationsRead(username) {
    await sequelize.query(
        'UPDATE "Notification" SET is_read = true WHERE name_client = :username AND is_read = false',
        {
            replacements: { username },
            type: QueryTypes.UPDATE,
        }
    );
}

async function deleteNotification(id, username) {
    const result = await sequelize.query(
        'DELETE FROM "Notification" WHERE id = :id AND name_client = :username',
        {
            replacements: { id, username },
            type: QueryTypes.DELETE,
        }
    );
    if (result[1] === 0) {
        const error = new Error('Notification introuvable');
        error.statusCode = 404;
        throw error;
    }
}

async function savePushSubscription(username, { endpoint, keys }) {
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        const error = new Error('Abonnement push invalide');
        error.statusCode = 400;
        throw error;
    }

    const clients = await sequelize.query(
        'SELECT id FROM "Client" WHERE name = :username LIMIT 1',
        {
            replacements: { username },
            type: QueryTypes.SELECT,
        }
    );

    if (clients.length === 0) {
        const error = new Error('Client introuvable');
        error.statusCode = 404;
        throw error;
    }

    await sequelize.query(
        `INSERT INTO "PushSubscription" (id_client, endpoint, p256dh, auth, created_at)
         VALUES (:idClient, :endpoint, :p256dh, :auth, NOW())
         ON CONFLICT (endpoint, id_client)
         DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
        {
            replacements: { idClient: clients[0].id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
            type: QueryTypes.INSERT,
        }
    );
}

async function removePushSubscription(endpoint) {
    await sequelize.query(
        'DELETE FROM "PushSubscription" WHERE endpoint = :endpoint',
        {
            replacements: { endpoint },
            type: QueryTypes.DELETE,
        }
    );
}

// Supprime uniquement la ligne du client donné : un même endpoint (navigateur/appareil)
// peut désormais être partagé par plusieurs clients, on ne veut pas désabonner les autres.
async function removePushSubscriptionForClient(username, endpoint) {
    await sequelize.query(
        `DELETE FROM "PushSubscription" ps
         USING "Client" c
         WHERE ps.id_client = c.id AND c.name = :username AND ps.endpoint = :endpoint`,
        {
            replacements: { username, endpoint },
            type: QueryTypes.DELETE,
        }
    );
}

async function getPushSubscriptionsForUsers(usernames) {
    if (!usernames?.length) {
        return [];
    }

    return sequelize.query(
        `SELECT ps.endpoint, ps.p256dh, ps.auth
         FROM "PushSubscription" ps
         INNER JOIN "Client" c ON c.id = ps.id_client
         WHERE c.name IN (:usernames)`,
        {
            replacements: { usernames },
            type: QueryTypes.SELECT,
        }
    );
}

async function updateCoverIfNeeded(libraryId, mangaInfo, existingCoverPath) {
    const shouldUpdateCover = !existingCoverPath && (mangaInfo.coverPath || mangaInfo.coverUrl);

    if (shouldUpdateCover) {
        await sequelize.query(
            `UPDATE "Library"
             SET cover_path = COALESCE(:coverPath, cover_path),
                 cover_url = COALESCE(:coverUrl, cover_url)
             WHERE id = :libraryId`,
            {
                replacements: {
                    coverPath: mangaInfo.coverPath || null,
                    coverUrl: mangaInfo.coverUrl || null,
                    libraryId,
                },
                type: QueryTypes.UPDATE,
            }
        );
    }
}

async function insertTags(libraryId, tags) {
    const normalizedTags = Array.isArray(tags)
        ? tags
            .map(tag => {
                if (typeof tag === 'string') {
                    return { name: tag, type: null };
                }

                if (tag && typeof tag === 'object') {
                    const tagName = tag.name || tag.title || tag.slug || null;
                    return tagName ? { name: tagName, type: tag.type || tag.category || null } : null;
                }

                return null;
            })
            .filter(Boolean)
        : [];
    
    for (const tag of normalizedTags) {
        const exists = await sequelize.query(
            'SELECT id FROM "Tag" WHERE name = :name AND id_library = :libraryId LIMIT 1',
            {
                replacements: {
                    name: tag.name,
                    libraryId,
                },
                type: QueryTypes.SELECT,
            }
        );

        if (exists.length === 0) {
            await sequelize.query(
                'INSERT INTO "Tag" (name, type, id_library) VALUES (:name, :type, :libraryId)',
                {
                    replacements: {
                        name: tag.name,
                        type: tag.type || null,
                        libraryId,
                    },
                    type: QueryTypes.INSERT,
                }
            );
        }
    }
}

async function linkLibrarySource(libraryId, sourceId, mangaUrl, libraryType = null) {
    const libraryTypeId = await getOrCreateLibraryType(libraryType);
    const existingLink = await sequelize.query(
        'SELECT url FROM "LibrarySource" WHERE id_library = :libraryId AND id_source = :sourceId LIMIT 1',
        {
            replacements: {
                libraryId,
                sourceId,
            },
            type: QueryTypes.SELECT,
        }
    );

    if (existingLink.length === 0) {
        await sequelize.query(
            'INSERT INTO "LibrarySource" (id_library, id_source, id_library_type, url) VALUES (:libraryId, :sourceId, :libraryTypeId, :mangaUrl)',
            {
                replacements: {
                    libraryId,
                    sourceId,
                    libraryTypeId,
                    mangaUrl: mangaUrl || null,
                },
                type: QueryTypes.INSERT,
            }
        );
    } else if (libraryTypeId) {
        await sequelize.query(
            'UPDATE "LibrarySource" SET id_library_type = COALESCE(id_library_type, :libraryTypeId) WHERE id_library = :libraryId AND id_source = :sourceId',
            {
                replacements: {
                    libraryId,
                    sourceId,
                    libraryTypeId,
                },
                type: QueryTypes.UPDATE,
            }
        );
    }
}

async function saveLastChapter(libraryId, sourceId, lastChapter, chapterUrl) {
    const existing = await sequelize.query(
        'SELECT 1 FROM "Chapters" WHERE id_library = :libraryId AND id_source = :sourceId AND chapter = :chapter LIMIT 1',
        {
            replacements: {
                libraryId,
                sourceId,
                chapter: lastChapter || null,
            },
            type: QueryTypes.SELECT,
        }
    );
    const isNew = existing.length === 0;

    await sequelize.query(
        `INSERT INTO "Chapters" (id_library, id_source, chapter, url)
         VALUES (:libraryId, :sourceId, :chapter, :url)
         ON CONFLICT (id_library, id_source, chapter)
         DO UPDATE SET url = EXCLUDED.url`,
        {
            replacements: {
                libraryId,
                sourceId,
                chapter: lastChapter || null,
                url: chapterUrl || null,
            },
            type: QueryTypes.INSERT,
        }
    );

    return isNew;
}

async function saveChapter(sourceName, lastChapter, chapterUrl, mangaUrl, mangaInfo) {
    try {
        const sourceId = await initSource(sourceName);
        const library = await getOrCreateLibrary(mangaInfo);
        const libraryType = mangaInfo.type || null;

        await updateCoverIfNeeded(library.id, mangaInfo, library.cover_path);
        await insertTags(library.id, mangaInfo.tags);
        await linkLibrarySource(library.id, sourceId, mangaUrl, libraryType);
        const isNew = await saveLastChapter(library.id, sourceId, lastChapter, chapterUrl);

        if (isNew && lastChapter) {
            await notifyFollowersOfNewChapter(library.id, sourceId, lastChapter, library.name || mangaInfo.title);
        }
    } catch (err) {
        console.error('❌ Erreur lors de la sauvegarde du chapitre:', err);
        throw err;
    }
}

// Crée une notification pour chaque utilisateur ayant activé les notifications (notify_enabled)
// pour cette œuvre, puis les pousse en temps réel via Web Push.
async function notifyFollowersOfNewChapter(idLibrary, idSource, chapter, title) {
    const followers = await sequelize.query(
        `INSERT INTO "Notification" (name_client, id_library, id_source, chapter, type, created_at)
         SELECT DISTINCT name_client, :idLibrary, :idSource, :chapter::numeric, 'new_chapter', NOW()
         FROM libraryusage
         WHERE id_library = :idLibrary AND notify_enabled = true
         RETURNING name_client`,
        {
            replacements: { idLibrary, idSource, chapter },
            type: QueryTypes.INSERT,
        }
    );

    const usernames = (followers[0] || []).map(row => row.name_client);
    if (usernames.length === 0) {
        return;
    }

    try {
        const { sendPushToUsers } = await import('./push.js');
        await sendPushToUsers(usernames, {
            title: title || 'Nouveau chapitre disponible',
            chapter,
            idLibrary,
        });
    } catch (err) {
        console.error('❌ Erreur lors de l\'envoi des notifications push:', err);
    }
}

function getChapters(callback, limit = null) {
    const query = `SELECT
            lc.id_library AS "chapterId",
            l.id AS "libraryId",
            l.name AS title,
            lt.type AS type,
            l.author AS author,
            l.artist AS artist,
            l.theme AS theme,
            l.status AS status,
            l.description AS description,
            l.cover_path AS "coverPath",
            l.cover_url AS "coverUrl",
            lc.chapter AS "lastChapter",
            lc.url AS "chapterUrl",
            ls.url AS "mangaUrl",
            s.name AS site
         FROM "Chapters" lc
         JOIN "Library" l ON lc.id_library = l.id
         JOIN "Source" s ON lc.id_source = s.id_source
         JOIN "LibrarySource" ls ON lc.id_library = ls.id_library AND lc.id_source = ls.id_source
         LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
         ORDER BY lc.id_library DESC, lc.id_source DESC, lc.chapter DESC${limit ? ' LIMIT :limit' : ''}`;

    sequelize.query(query, {
        replacements: limit ? { limit } : {},
        type: QueryTypes.SELECT,
    })
        .then(rows => {
            const groupedChapters = rows.reduce((acc, row) => {
                const libraryId = row.libraryId;
                if (!acc[libraryId]) {
                    acc[libraryId] = {
                        id: row.mangaId,
                        title: row.title,
                        type: row.type,
                        theme: row.theme,
                        status: row.status,
                        description: row.description,
                        author: row.author,
                        artist: row.artist,
                        coverPath: row.coverPath,
                        coverUrl: row.coverUrl,
                        sites: {},
                        
                    };
                }
                if (!acc[libraryId].sites[row.site]) {
                    acc[libraryId].sites[row.site] = {
                        site: row.site,
                        site: row.site,
                        mangaUrl: row.mangaUrl,
                        chapters: [],
                    };
                }
                const chapter = {
                    chapter: row.lastChapter,
                    url: row.chapterUrl,
                    chapterUrl: row.chapterUrl,
                    site: row.site,
                };
                acc[libraryId].sites[row.site].chapters.push(chapter);
                return acc;
            }, []);

            
            return callback(null, groupedChapters);
        })
        .catch(err => callback(err));
}

function getChaptersByLibrary(id_library, callback) {
    sequelize.query(
        `SELECT c.chapter, c.url, s.name AS site
         FROM "Chapters" c
         JOIN "Source" s ON c.id_source = s.id_source
         WHERE c.id_library = :idLibrary
         ORDER BY CAST(c.chapter AS REAL) ASC`,
        {
            replacements: { idLibrary: id_library },
            type: QueryTypes.SELECT,
        }
    )
        .then(rows => callback(null, rows))
        .catch(err => callback(err));
}

function getAllMangas(callback) {
    sequelize.query(
        `SELECT DISTINCT
            l.id,
            l.name AS title,
            l.status,
            COALESCE(lu.reading_status, 'Reading') AS "readingStatus",
            lu.score AS rating,
            lu.last_chapter AS "lastReadChapter",
            lc.chapter AS "latestChapter",
            NULL AS "lastReadDate",
            NULL AS "lastReleaseDate"
         FROM "Library" l
         LEFT JOIN libraryusage lu ON l.id = lu.id_library
         LEFT JOIN "LastChapters" lc ON l.id = lc.id_library
         ORDER BY l.name`,
        {
            type: QueryTypes.SELECT,
        }
    )
        .then(rows => callback(null, rows))
        .catch(err => callback(err));
        
}


function getClient(username, callback) {
    sequelize.query(
        `SELECT
            c.id as "clientId",
            c.name as "clientName", 
            c.code as "clientCode", 
            c.email as "clientEmail",
            c.google_id as "clientGoogleId",
            s.name as "clientSubscription",
            lu.last_chapter as "lastReadChapter",
            lu.reading_status as "readingStatus",
            lu.score as "clientScore",
            lu.id_library as "libraryId",
            lu.note as "clientNote",
            lu.id_source as "sourceId",
            EXISTS (
                SELECT 1 FROM "PushSubscription" ps WHERE ps.id_client = c.id
            ) as "pushEnabled"
        FROM "Client" as c
        LEFT JOIN "libraryusage" as lu ON c.name = lu.name_client
        INNER JOIN "Subscription" as s ON c.id_subscription = s.id
        WHERE c.name = :username`,
        {
            replacements: { username },
            type: QueryTypes.SELECT,
        }
    )
        .then(rows => {
            if (rows.length === 0) {
                const error = new Error('Client introuvable');
                error.statusCode = 404;
                throw error;
            }

            const row = rows[0];
            const client = {
                    clientId: row.clientId,
                    clientName: row.clientName,
                    clientCode: row.clientCode,
                    clientEmail: row.clientEmail,
                    clientGoogleId: row.clientGoogleId,
                    clientSubscription: row.clientSubscription,
                    pushEnabled: row.pushEnabled,
                    // Le LEFT JOIN produit une ligne avec libraryId = null quand le client ne suit aucune œuvre
                    libraryUsage: rows
                        .filter(row => row.libraryId !== null)
                        .map(row => ({
                            libraryId: row.libraryId,
                            lastReadChapter: row.lastReadChapter,
                            readingStatus: row.readingStatus,
                            clientScore: row.clientScore,
                            clientNote: row.clientNote,
                            sourceId: row.sourceId,
                        })),
                    
                };
            callback(null, client);
        })
        .catch(err => callback(err));
}

export {
    sequelize,
    initDb,
    initSource,
    saveChapter,
    getChapters,
    getChaptersByLibrary,
    getAllMangas,
    isLibraryExist,
    addLibraryToUser,
    isLibraryInUserLibrary,
    getUserLibrary,
    updateUserLibrary,
    deleteUserLibrary,
    getClient,
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    savePushSubscription,
    removePushSubscription,
    removePushSubscriptionForClient,
    getPushSubscriptionsForUsers,
};
