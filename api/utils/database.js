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

async function saveChapter(sourceName, lastChapter, chapterUrl, mangaUrl, mangaInfo) {
    const db = new sqlite3.Database(DB_NAME);

    return new Promise((resolve, reject) => {
        // 1️⃣ Vérifie ou crée la source
        db.get('SELECT id_source FROM Source WHERE name = ?', [sourceName], (err, source) => {
            if (err) {
                console.error('❌ Erreur lors de la récupération de la source:', err);
                db.close();
                reject(err);
                return;
            }

            function processWithSource(sourceId) {
                // 2️⃣ Vérifie si le manga existe déjà
                db.get('SELECT id, cover_path, cover_url FROM Library WHERE name = ?', [mangaInfo.title], (err, library) => {
                    if (err) {
                        console.error('❌ Erreur lors de la récupération du manga:', err);
                        db.close();
                        reject(err);
                        return;
                    }

                    function processWithLibrary(libraryId, existingCoverPath, existingCoverUrl) {
                        // 3️⃣ Met à jour la cover si non présente
                        const shouldUpdateCover = !existingCoverPath && (mangaInfo.coverPath || mangaInfo.coverUrl);
                        
                        function insertTags() {
                            // 4️⃣ Insertion des tags
                            if (!mangaInfo.tags || mangaInfo.tags.length === 0) {
                                linkLibrarySource();
                                return;
                            }

                            let tagIndex = 0;
                            function insertNextTag() {
                                if (tagIndex >= mangaInfo.tags.length) {
                                    linkLibrarySource();
                                    return;
                                }

                                const tag = mangaInfo.tags[tagIndex];
                                db.get(
                                    'SELECT id FROM Tag WHERE name = ? AND id_library = ?',
                                    [tag.name, libraryId],
                                    (err, exists) => {
                                        if (!exists) {
                                            db.run(
                                                'INSERT INTO Tag (name, type, id_library) VALUES (?, ?, ?)',
                                                [tag.name, tag.type, libraryId],
                                                (err) => {
                                                    if (err) console.error('❌ Erreur insertion tag:', err);
                                                    tagIndex++;
                                                    insertNextTag();
                                                }
                                            );
                                        } else {
                                            tagIndex++;
                                            insertNextTag();
                                        }
                                    }
                                );
                            }
                            insertNextTag();
                        }

                        function linkLibrarySource() {
                            // 5️⃣ Liaison Library ↔ Source
                            db.get(
                                'SELECT url FROM LibrarySource WHERE id_library = ? AND id_source = ?',
                                [libraryId, sourceId],
                                (err, existingLink) => {
                                    if (err) {
                                        console.error('❌ Erreur vérification LibrarySource:', err);
                                        db.close();
                                        reject(err);
                                        return;
                                    }

                                    function insertLastChapter() {
                                        // 6️⃣ Enregistrement du dernier chapitre
                                        db.run(
                                            'INSERT OR REPLACE INTO LastChapters (id_library, id_source, chapter, url) VALUES (?, ?, ?, ?)',
                                            [libraryId, sourceId, lastChapter, chapterUrl],
                                            (err) => {
                                                if (err) {
                                                    console.error('❌ Erreur insertion LastChapters:', err);
                                                    db.close();
                                                    reject(err);
                                                } else {
                                                    db.close();
                                                    resolve();
                                                }
                                            }
                                        );
                                    }

                                    if (!existingLink) {
                                        db.run(
                                            'INSERT INTO LibrarySource (id_library, id_source, url) VALUES (?, ?, ?)',
                                            [libraryId, sourceId, mangaUrl],
                                            (err) => {
                                                if (err) console.error('❌ Erreur insertion LibrarySource:', err);
                                                insertLastChapter();
                                            }
                                        );
                                    } else {
                                        insertLastChapter();
                                    }
                                }
                            );
                        }

                        if (shouldUpdateCover) {
                            db.run(
                                'UPDATE Library SET cover_path = COALESCE(?, cover_path), cover_url = COALESCE(?, cover_url) WHERE id = ?',
                                [mangaInfo.coverPath || null, mangaInfo.coverUrl || null, libraryId],
                                (err) => {
                                    if (err) console.error('❌ Erreur mise à jour cover:', err);
                                    insertTags();
                                }
                            );
                        } else {
                            insertTags();
                        }
                    }

                    if (!library) {
                        // Créer le manga
                        db.run(
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
                            ],
                            function(err) {
                                if (err) {
                                    console.error('❌ Erreur insertion Library:', err);
                                    db.close();
                                    reject(err);
                                    return;
                                }
                                processWithLibrary(this.lastID, mangaInfo.coverPath, mangaInfo.coverUrl);
                            }
                        );
                    } else {
                        processWithLibrary(library.id, library.cover_path, library.cover_url);
                    }
                });
            }

            if (!source) {
                // Créer la source
                db.run('INSERT INTO Source (name) VALUES (?)', [sourceName], function(err) {
                    if (err) {
                        console.error('❌ Erreur insertion Source:', err);
                        db.close();
                        reject(err);
                        return;
                    }
                    processWithSource(this.lastID);
                });
            } else {
                processWithSource(source.id_source);
            }
        });
    });
}

function getLastChapters(callback, limit = null) {
    const db = new sqlite3.Database(DB_NAME);
    let query = `SELECT 
            lc.rowid AS chapterId,
            l.name AS title,
            l.author AS author,
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

export {initDb, initSource, saveChapter, getLastChapters, getAllMangas};