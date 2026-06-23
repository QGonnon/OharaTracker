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

// Promisification des opérations SQLite
function dbGet(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbRun(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

async function isLibraryExist(title) {
    const db = new sqlite3.Database(DB_NAME);
    let library = await dbGet(db, 'SELECT id, cover_path, cover_url FROM Library WHERE name = ?', [title]);
    db.close();
    return !!library;
}

async function getOrCreateSource(db, sourceName) {
    let source = await dbGet(db, 'SELECT id_source FROM Source WHERE name = ?', [sourceName]);
    
    if (!source) {
        const sourceId = await dbRun(db, 'INSERT INTO Source (name) VALUES (?)', [sourceName]);
        return sourceId;
    }
    
    return source.id_source;
}

async function getOrCreateLibrary(db, mangaInfo) {
    let library = await dbGet(db, 'SELECT id, cover_path, cover_url FROM Library WHERE name = ?', [mangaInfo.title]);
    
    if (!library) {
        const libraryId = await dbRun(
            db,
            `INSERT INTO Library (name, description, type, demographic, published, status, artist, author, theme, publishers, cover_path, cover_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                mangaInfo.title,
                mangaInfo.description || null,
                mangaInfo.type || null,
                mangaInfo.demographic || null,
                mangaInfo.published || null,
                mangaInfo.status || null,
                mangaInfo.artist || null,
                mangaInfo.author || null,
                mangaInfo.theme || null,
                mangaInfo.publishers || null,
                mangaInfo.coverPath || null,
                mangaInfo.coverUrl || null
            ]
        );
        return { id: libraryId, cover_path: mangaInfo.coverPath, cover_url: mangaInfo.coverUrl };
    }
    
    return library;
}

async function updateCoverIfNeeded(db, libraryId, mangaInfo, existingCoverPath) {
    const shouldUpdateCover = !existingCoverPath && (mangaInfo.coverPath || mangaInfo.coverUrl);
    
    if (shouldUpdateCover) {
        await dbRun(
            db,
            'UPDATE Library SET cover_path = COALESCE(?, cover_path), cover_url = COALESCE(?, cover_url) WHERE id = ?',
            [mangaInfo.coverPath || null, mangaInfo.coverUrl || null, libraryId]
        );
    }
}

async function insertTags(db, libraryId, tags) {
    if (!tags || tags.length === 0) return;
    
    for (const tag of tags) {
        const exists = await dbGet(
            db,
            'SELECT id FROM Tag WHERE name = ? AND id_library = ?',
            [tag.name, libraryId]
        );
        
        if (!exists) {
            await dbRun(
                db,
                'INSERT INTO Tag (name, type, id_library) VALUES (?, ?, ?)',
                [tag.name, tag.type, libraryId]
            );
        }
    }
}

async function linkLibrarySource(db, libraryId, sourceId, mangaUrl) {
    const existingLink = await dbGet(
        db,
        'SELECT url FROM LibrarySource WHERE id_library = ? AND id_source = ?',
        [libraryId, sourceId]
    );
    
    if (!existingLink) {
        await dbRun(
            db,
            'INSERT INTO LibrarySource (id_library, id_source, url) VALUES (?, ?, ?)',
            [libraryId, sourceId, mangaUrl]
        );
    }
}

async function saveLastChapter(db, libraryId, sourceId, lastChapter, chapterUrl) {
    await dbRun(
        db,
        'INSERT OR REPLACE INTO Chapters (id_library, id_source, chapter, url) VALUES (?, ?, ?, ?)',
        [libraryId, sourceId, lastChapter, chapterUrl]
    );
}

async function saveChapter(sourceName, lastChapter, chapterUrl, mangaUrl, mangaInfo) {
    const db = new sqlite3.Database(DB_NAME);
    
    try {
        // Récupérer ou créer la source
        const sourceId = await getOrCreateSource(db, sourceName);
        
        // Récupérer ou créer le manga
        const library = await getOrCreateLibrary(db, mangaInfo);
        
        // Mettre à jour la cover si nécessaire
        await updateCoverIfNeeded(db, library.id, mangaInfo, library.cover_path);
        
        // Insérer les tags
        await insertTags(db, library.id, mangaInfo.tags);
        
        // Lier le manga à la source
        await linkLibrarySource(db, library.id, sourceId, mangaUrl);
        
        // Enregistrer le dernier chapitre
        await saveLastChapter(db, library.id, sourceId, lastChapter, chapterUrl);
        
    } catch (err) {
        console.error('❌ Erreur lors de la sauvegarde du chapitre:', err);
        throw err;
    } finally {
        db.close();
    }
}

function getChapters(callback, limit = null) {
    const db = new sqlite3.Database(DB_NAME);
    let query = `SELECT 
            c.rowid AS chapterId,
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

function getChaptersByLibrary(id_library, callback) {
    const db = new sqlite3.Database(DB_NAME);
    db.all(
        `SELECT c.chapter, c.url, s.name AS site
         FROM Chapters c
         JOIN Source s ON c.id_source = s.id_source
         WHERE c.id_library = ?
         ORDER BY CAST(c.chapter AS REAL) ASC`,
        [id_library],
        (err, rows) => {
            callback(err, rows);
            db.close();
        }
    );
}

export {initDb, initSource, saveChapter, getChapters, getChaptersByLibrary, getAllMangas, isLibraryExist};
