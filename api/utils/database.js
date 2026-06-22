import sqlite3 from 'sqlite3';
import fs from 'fs';

const DB_NAME = 'manga.db';
const DB_INIT = fs.readFileSync('./utils/database.sql').toString();
var db_source = {};

function initDb() {
    const db = new sqlite3.Database(DB_NAME);
    const db_req = DB_INIT.toString().split(');');
    db.serialize(() => {
        db.run('PRAGMA foreign_keys = OFF;');
        db.run('BEGIN TRANSACTION;');
        db_req.forEach(req => {
            if (req){
                req += ');';
                db.run(req);
            }
        });
        db.run('COMMIT;', [], (err) => {
            db.close();
            // Now run initSource after schema setup
            initSource('MangaDex');
            initSource('scan-manga');
            initSource('AsuraComic');
        });
    });
}

function initSource(name){
    const db = new sqlite3.Database(DB_NAME);
    db.get('SELECT id_source FROM Source WHERE name = ?', [name], (err, row) => {
        if (err) {
            console.error(`🛑 Erreur lors de la vérification de la source: ${err.message}`);
            db.close();
            return;
        }
        if (row) {
            db_source[name] = row.id_source;
            db.close();
            return;
        }
        db.run(
            'INSERT INTO Source (name) VALUES (?)',
            [name],
            function(err) {
                if (err && err.code !== 'SQLITE_CONSTRAINT') {
                    console.error(`🛑 Erreur lors de l'insertion dans la base de données: ${err.message}`);
                } else {
                    db_source[name] = this.lastID;
                }
                db.close();
            }
        );
    });
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
        'INSERT OR REPLACE INTO LastChapters (id_library, id_source, chapter, url) VALUES (?, ?, ?, ?)',
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

function getLastChapters(callback, limit = null) {
    const db = new sqlite3.Database(DB_NAME);
    let query = `SELECT 
            lc.rowid AS chapterId,
            l.name AS title,
            l.type AS type,
            l.author AS author,
            l.artist AS artist,
            l.theme AS theme,
            l.status AS status,
            l.description AS description,
            l.cover_path AS coverPath,
            l.cover_url AS coverUrl,
            lc.chapter AS lastChapter,
            lc.url AS chapterUrl,
            ls.url AS mangaUrl,
            s.name AS site
         FROM LastChapters lc
         JOIN Library l ON lc.id_library = l.id
         JOIN Source s ON lc.id_source = s.id_source
         JOIN LibrarySource ls ON lc.id_library = ls.id_library AND lc.id_source = ls.id_source
         ORDER BY lc.rowid DESC`;
    
    if (limit) {
        query += ` LIMIT ?`;
        db.all(query, [limit], (err, rows) => {
            callback(err, rows);
            db.close();
        });
    } else {
        db.all(query, (err, rows) => {
            callback(err, rows);
            db.close();
        });
    }
}

function getAllMangas(callback) {
    const db = new sqlite3.Database(DB_NAME);
    db.all(
        `SELECT DISTINCT
            l.id,
            l.name AS title,
            l.status,
            'Reading' AS readingStatus,
            COALESCE(ur.rating, NULL) AS rating,
            COALESCE(ur.last_read_chapter, 0) AS lastReadChapter,
            COALESCE(MAX(lc.chapter), 0) AS latestChapter,
            CASE 
                WHEN ur.last_read_date IS NOT NULL THEN 
                    CASE 
                        WHEN DATE(ur.last_read_date) = DATE('now') THEN 'Read today'
                        WHEN DATE(ur.last_read_date) = DATE('now', '-1 day') THEN 'Read a day ago'
                        WHEN DATE(ur.last_read_date) >= DATE('now', '-7 days') THEN 
                            'Read ' || CAST((julianday('now') - julianday(ur.last_read_date)) AS INTEGER) || ' days ago'
                        WHEN DATE(ur.last_read_date) >= DATE('now', '-30 days') THEN 
                            'Read ' || CAST((julianday('now') - julianday(ur.last_read_date)) / 7 AS INTEGER) || ' weeks ago'
                        ELSE 'Read ' || CAST((julianday('now') - julianday(ur.last_read_date)) / 30 AS INTEGER) || ' months ago'
                    END
                ELSE 'Haven''t read yet'
            END AS lastReadDate,
            CASE 
                WHEN MAX(lc.date_added) IS NOT NULL THEN 
                    CASE 
                        WHEN DATE(MAX(lc.date_added)) = DATE('now') THEN 'Released today'
                        WHEN DATE(MAX(lc.date_added)) = DATE('now', '-1 day') THEN 'Released a day ago'
                        WHEN DATE(MAX(lc.date_added)) >= DATE('now', '-7 days') THEN 
                            'Released ' || CAST((julianday('now') - julianday(MAX(lc.date_added))) AS INTEGER) || ' days ago'
                        WHEN DATE(MAX(lc.date_added)) >= DATE('now', '-30 days') THEN 
                            'Released ' || CAST((julianday('now') - julianday(MAX(lc.date_added))) / 7 AS INTEGER) || ' weeks ago'
                        ELSE 'Released ' || CAST((julianday('now') - julianday(MAX(lc.date_added))) / 30 AS INTEGER) || ' months ago'
                    END
                ELSE 'No release info'
            END AS lastReleaseDate
         FROM Library l
         LEFT JOIN UserReading ur ON l.id = ur.id_library
         LEFT JOIN LastChapters lc ON l.id = lc.id_library
         GROUP BY l.id, l.name, l.status, ur.rating, ur.last_read_chapter, ur.last_read_date
         ORDER BY l.name`,
        [],
        (err, rows) => {
            callback(err, rows);
            db.close();
        }
    );
}

export {initDb, initSource, saveChapter, getLastChapters, getAllMangas, isLibraryExist};