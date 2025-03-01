import sqlite3 from 'sqlite3';
import fs from 'fs';

const DB_NAME = 'manga.db';
const DB_INIT = fs.readFileSync('./utils/database.sql').toString();

function initDb() {
    const db = new sqlite3.Database(DB_NAME);
    const db_req = DB_INIT.toString().split(');');
    db.serialize(() => {
        db.run('PRAGMA foreign_keys = OFF;');
        db.run('BEGIN TRANSACTION;');
        db_req.forEach(req => {
            if (req){
                req += ');';
                console.log(req);
                db.run(req);
            }
        });
        db.run('COMMIT;');

    });
    db.close();
}

function saveChapter(site, chapter, chapterUrl, mangaUrl, mangaName) {
    // const db = new sqlite3.Database(DB_NAME);
    // db.run(`
    //     INSERT INTO chapters (site, lastChapter, chapterUrl, mangaUrl, name) 
    //     VALUES (?, ?, ?, ?, ?)
    // `, [site, chapter, chapterUrl, mangaUrl, mangaName], (err) => {
    //     if (err && err.code !== 'SQLITE_CONSTRAINT') {
    //         console.error(`🛑 Erreur lors de l'insertion dans la base de données: ${err.message}`);
    //     }
    // });
    // db.close();
}

function getLastChapters(callback){
    // const db = new sqlite3.Database(DB_NAME);
    // db.all(`
    //     SELECT id, site, name, lastChapter, chapterUrl, mangaUrl, created_at
    //     FROM chapters
    //     ORDER BY created_at DESC
    //     LIMIT 40
    // `, [], callback);
    // db.close();
}

export {initDb, saveChapter, getLastChapters};