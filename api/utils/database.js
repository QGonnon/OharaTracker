import sqlite3 from 'sqlite3';

const DB_NAME = 'manga.db';

function initDb() {
    const db = new sqlite3.Database(DB_NAME);
    db.run(`
        CREATE TABLE IF NOT EXISTS chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site TEXT,
            name TEXT,
            lastChapter TEXT,
            chapterUrl TEXT UNIQUE,
            mangaUrl TEXT UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    db.close();
}

function saveChapter(site, chapter, chapterUrl, mangaUrl, mangaName) {
    const db = new sqlite3.Database(DB_NAME);
    db.run(`
        INSERT INTO chapters (site, lastChapter, chapterUrl, mangaUrl, name) 
        VALUES (?, ?, ?, ?, ?)
    `, [site, chapter, chapterUrl, mangaUrl, mangaName], (err) => {
        if (err && err.code !== 'SQLITE_CONSTRAINT') {
            console.error(`🛑 Erreur lors de l'insertion dans la base de données: ${err.message}`);
        }
    });
    db.close();
}

function getLastChapters(callback){
    const db = new sqlite3.Database(DB_NAME);
    db.all(`
        SELECT id, site, name, lastChapter, chapterUrl, mangaUrl, created_at
        FROM chapters
        ORDER BY created_at DESC
        LIMIT 40
    `, [], callback);
    db.close();
}

export {initDb, saveChapter, getLastChapters};