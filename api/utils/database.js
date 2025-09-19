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

function saveChapter(sourceName, chapter, chapterUrl, mangaUrl, mangaName) {
    const db = new sqlite3.Database(DB_NAME);

    // Step 1: Ensure source exists and get its id
    db.get('SELECT id_source FROM Source WHERE name = ?', [sourceName], (err, sourceRow) => {
        if (err || !sourceRow) {
            console.error(`🛑 Source "${sourceName}" introuvable ou erreur: ${err?.message}`);
            db.close();
            return;
        }
        const id_source = sourceRow.id_source;

        // Step 2: Ensure manga exists in Library
        db.get('SELECT id FROM Library WHERE name = ?', [mangaName], (err, libraryRow) => {
            if (err) {
                console.error(`🛑 Erreur lors de la recherche du manga: ${err.message}`);
                db.close();
                return;
            }

            function insertChapter(id_library) {
                // Step 4: Insert chapter in LastChapters
                db.run(
                    `INSERT OR REPLACE INTO LastChapters (id_library, id_source, chapter, url) VALUES (?, ?, ?, ?)`,
                    [id_library, id_source, chapter, chapterUrl],
                    (err) => {
                        if (err && err.code !== 'SQLITE_CONSTRAINT') {
                            console.error(`🛑 Erreur lors de l'insertion dans LastChapters: ${err.message}`);
                        }
                        db.close();
                    }
                );
            }

            if (!libraryRow) {
                // Step 3: Insert manga in Library
                db.run(
                    'INSERT INTO Library (name) VALUES (?)',
                    [mangaName],
                    function(err) {
                        if (err) {
                            console.error(`🛑 Erreur lors de l'insertion du manga: ${err.message}`);
                            db.close();
                            return;
                        }
                        const id_library = this.lastID;
                        // Step 3b: Insert relation in LibrarySource
                        db.run(
                            'INSERT INTO LibrarySource (id_library, id_source, url) VALUES (?, ?, ?)',
                            [id_library, id_source, mangaUrl],
                            (err) => {
                                if (err && err.code !== 'SQLITE_CONSTRAINT') {
                                    console.error(`🛑 Erreur lors de l'insertion dans LibrarySource: ${err.message}`);
                                }
                                insertChapter(id_library);
                            }
                        );
                    }
                );
            } else {
                const id_library = libraryRow.id;
                // Ensure LibrarySource relation exists
                db.get(
                    'SELECT 1 FROM LibrarySource WHERE id_library = ? AND id_source = ?',
                    [id_library, id_source],
                    (err, relRow) => {
                        if (!relRow) {
                            db.run(
                                'INSERT INTO LibrarySource (id_library, id_source, url) VALUES (?, ?, ?)',
                                [id_library, id_source, mangaUrl],
                                (err) => {
                                    if (err && err.code !== 'SQLITE_CONSTRAINT') {
                                        console.error(`🛑 Erreur lors de l\'insertion dans LibrarySource: ${err.message}`);
                                    }
                                    insertChapter(id_library);
                                }
                            );
                        } else {
                            insertChapter(id_library);
                        }
                    }
                );
            }
        });
    });
}

function getLastChapters(callback, limit = 40) {
    const db = new sqlite3.Database(DB_NAME);
    db.all(
        `SELECT 
            lc.rowid AS chapterId,
            l.name AS title,
            lc.chapter AS lastChapter,
            lc.url AS chapterUrl,
            ls.url AS mangaUrl,
            s.name AS site
         FROM LastChapters lc
         JOIN Library l ON lc.id_library = l.id
         JOIN Source s ON lc.id_source = s.id_source
         JOIN LibrarySource ls ON lc.id_library = ls.id_library AND lc.id_source = ls.id_source
         ORDER BY lc.rowid DESC
         LIMIT ?`,
        [limit],
        (err, rows) => {
            callback(err, rows);
            db.close();
        }
    );
}

export {initDb, initSource, saveChapter, getLastChapters};