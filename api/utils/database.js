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

async function saveChapter(sourceName, lastChapter, chapterUrl, mangaUrl, mangaInfo) {
    await sequelize.authenticate();

    const sourceId = await initSource(sourceName);

    const libraries = await sequelize.query(
        'SELECT id, cover_path, cover_url FROM "Library" WHERE name = :title LIMIT 1',
        {
            replacements: { title: mangaInfo.title },
            type: QueryTypes.SELECT,
        }
    );

    let library = libraries[0] || null;

    if (!library) {
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

        library = createdLibraries[0] || null;
    } else if (!library.cover_path && (mangaInfo.coverPath || mangaInfo.coverUrl)) {
        await sequelize.query(
            `UPDATE "Library"
             SET cover_path = COALESCE(:coverPath, cover_path),
                 cover_url = COALESCE(:coverUrl, cover_url)
             WHERE id = :libraryId`,
            {
                replacements: {
                    coverPath: mangaInfo.coverPath || null,
                    coverUrl: mangaInfo.coverUrl || null,
                    libraryId: library.id,
                },
                type: QueryTypes.UPDATE,
            }
        );

        library.cover_path = mangaInfo.coverPath || library.cover_path;
        library.cover_url = mangaInfo.coverUrl || library.cover_url;
    }

    if (!library) {
        throw new Error('Impossible de récupérer ou créer la bibliothèque du manga');
    }

    const normalizedTags = Array.isArray(mangaInfo.tags)
        ? mangaInfo.tags
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

    if (normalizedTags.length > 0) {
        for (const tag of normalizedTags) {
            const existingTag = await sequelize.query(
                'SELECT id FROM "Tag" WHERE name = :name AND id_library = :libraryId LIMIT 1',
                {
                    replacements: {
                        name: tag.name,
                        libraryId: library.id,
                    },
                    type: QueryTypes.SELECT,
                }
            );

            if (existingTag.length === 0) {
                await sequelize.query(
                    'INSERT INTO "Tag" (name, type, id_library) VALUES (:name, :type, :libraryId)',
                    {
                        replacements: {
                            name: tag.name,
                            type: tag.type || null,
                            libraryId: library.id,
                        },
                        type: QueryTypes.INSERT,
                    }
                );
            }
        }
    }

    const librarySource = await sequelize.query(
        'SELECT url FROM "LibrarySource" WHERE id_library = :libraryId AND id_source = :sourceId LIMIT 1',
        {
            replacements: {
                libraryId: library.id,
                sourceId,
            },
            type: QueryTypes.SELECT,
        }
    );

    if (librarySource.length === 0) {
        await sequelize.query(
            'INSERT INTO "LibrarySource" (id_library, id_source, url) VALUES (:libraryId, :sourceId, :mangaUrl)',
            {
                replacements: {
                    libraryId: library.id,
                    sourceId,
                    mangaUrl: mangaUrl || null,
                },
                type: QueryTypes.INSERT,
            }
        );
    }

    await sequelize.query(
        `INSERT INTO "LastChapters" (id_library, id_source, chapter, url)
         VALUES (:libraryId, :sourceId, :chapter, :url)
         ON CONFLICT (id_library, id_source)
         DO UPDATE SET chapter = EXCLUDED.chapter, url = EXCLUDED.url`,
        {
            replacements: {
                libraryId: library.id,
                sourceId,
                chapter: lastChapter || null,
                url: chapterUrl || null,
            },
            type: QueryTypes.INSERT,
        }
    );
}

function getLastChapters(callback, limit = null) {
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

export { initDb, initSource, saveChapter, getLastChapters, getAllMangas };