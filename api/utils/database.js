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
            name, description, type, demographic, published, status,
            artist, author, theme, publishers, cover_path, cover_url
        ) VALUES (
            :title, :description, :type, :demographic, :published, :status,
            :artist, :author, :theme, :publishers, :coverPath, :coverUrl
        )`,
        {
            replacements: {
                title: mangaInfo.title,
                description: mangaInfo.description || null,
                type: mangaInfo.type || null,
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

async function linkLibrarySource(libraryId, sourceId, mangaUrl) {
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
            'INSERT INTO "LibrarySource" (id_library, id_source, url) VALUES (:libraryId, :sourceId, :mangaUrl)',
            {
                replacements: {
                    libraryId,
                    sourceId,
                    mangaUrl: mangaUrl || null,
                },
                type: QueryTypes.INSERT,
            }
        );
    }
}

async function saveLastChapter(libraryId, sourceId, lastChapter, chapterUrl) {
    await sequelize.query(
        `INSERT INTO "LastChapters" (id_library, id_source, chapter, url)
         VALUES (:libraryId, :sourceId, :chapter, :url)
         ON CONFLICT (id_library, id_source)
         DO UPDATE SET chapter = EXCLUDED.chapter, url = EXCLUDED.url`,
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
}

async function saveChapter(sourceName, lastChapter, chapterUrl, mangaUrl, mangaInfo) {
    try {
        const sourceId = await initSource(sourceName);
        const library = await getOrCreateLibrary(mangaInfo);

        await updateCoverIfNeeded(library.id, mangaInfo, library.cover_path);
        await insertTags(library.id, mangaInfo.tags);
        await linkLibrarySource(library.id, sourceId, mangaUrl);
        await saveLastChapter(library.id, sourceId, lastChapter, chapterUrl);
    } catch (err) {
        console.error('❌ Erreur lors de la sauvegarde du chapitre:', err);
        throw err;
    }
}

function getChapters(callback, limit = null) {
    const query = `SELECT
            lc.id_library AS "chapterId",
            l.name AS title,
            l.type AS type,
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
         FROM "LastChapters" lc
         JOIN "Library" l ON lc.id_library = l.id
         JOIN "Source" s ON lc.id_source = s.id_source
         JOIN "LibrarySource" ls ON lc.id_library = ls.id_library AND lc.id_source = ls.id_source
         ORDER BY lc.id_library DESC, lc.id_source DESC${limit ? ' LIMIT :limit' : ''}`;

    sequelize.query(query, {
        replacements: limit ? { limit } : {},
        type: QueryTypes.SELECT,
    })
        .then(rows => callback(null, rows))
        .catch(err => callback(err));
}

function getChaptersByLibrary(id_library, callback) {
    sequelize.query(
        `SELECT lc.chapter, lc.url, s.name AS site
         FROM "LastChapters" lc
         JOIN "Source" s ON lc.id_source = s.id_source
         WHERE lc.id_library = :idLibrary
         ORDER BY CAST(lc.chapter AS REAL) ASC`,
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

export { initDb, initSource, saveChapter, getChapters, getChaptersByLibrary, getAllMangas, isLibraryExist };
