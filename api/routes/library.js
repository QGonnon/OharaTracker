import express from 'express';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function openDb() {
    return open({
        filename: './manga.db',
        driver: sqlite3.Database
    });
}

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
}

router.post('/', authenticate, async (req, res) => {
    const {
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
        site
    } = req.body;

    if (!title || !site) {
        return res.status(400).json({ message: 'Champs manquants: title et site requis' });
    }

    const db = await openDb();

    try {
        // Ensure source exists
        let source = await db.get('SELECT id_source FROM Source WHERE name = ?', [site]);
        if (!source) {
            const result = await db.run('INSERT INTO Source (name) VALUES (?)', [site]);
            source = { id_source: result.lastID };
        }
        const id_source = source.id_source;

        // Upsert manga in Library
        let library = await db.get('SELECT id FROM Library WHERE name = ?', [title]);
        if (!library) {
            const insert = await db.run(
                `INSERT INTO Library (name, author, theme, status, description, cover_path, cover_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)` ,
                [title, author || null, theme || null, status || null, description || null, coverPath || null, coverUrl || null]
            );
            library = { id: insert.lastID };
        } else {
            await db.run(
                `UPDATE Library
                 SET author = COALESCE(?, author),
                     theme = COALESCE(?, theme),
                     status = COALESCE(?, status),
                     description = COALESCE(?, description),
                     cover_path = COALESCE(?, cover_path),
                     cover_url = COALESCE(?, cover_url)
                 WHERE id = ?`,
                [author || null, theme || null, status || null, description || null, coverPath || null, coverUrl || null, library.id]
            );
        }
        const id_library = library.id;

        // Link Library to Source
        await db.run(
            `INSERT OR REPLACE INTO LibrarySource (id_library, id_source, url) VALUES (?, ?, ?)` ,
            [id_library, id_source, mangaUrl || null]
        );

        // Save last known chapter if provided
        if (lastChapter || chapterUrl) {
            await db.run(
                `INSERT OR REPLACE INTO LastChapters (id_library, id_source, chapter, url) VALUES (?, ?, ?, ?)` ,
                [id_library, id_source, lastChapter || null, chapterUrl || null]
            );
        }

        // Attach manga to the current user (detect existing)
        const existing = await db.get(
            `SELECT 1 FROM libraryusage WHERE id_library = ? AND name_client = ?` ,
            [id_library, req.user.username]
        );
        if (existing) {
            return res.status(409).json({ message: 'Déjà dans votre bibliothèque.' });
        }

        await db.run(
            `INSERT INTO libraryusage (id_library, name_client) VALUES (?, ?)` ,
            [id_library, req.user.username]
        );

        res.json({ message: 'Manga ajouté à votre bibliothèque', idLibrary: id_library });
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout à la bibliothèque:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du manga' });
    } finally {
        await db.close();
    }
});

router.get('/status', authenticate, async (req, res) => {
    const { title, site } = req.query;
    if (!title) return res.status(400).json({ message: 'Titre requis' });

    const db = await openDb();
    try {
        const manga = await db.get(
            `SELECT l.id
             FROM Library l
             LEFT JOIN LibrarySource ls ON l.id = ls.id_library
             LEFT JOIN Source s ON ls.id_source = s.id_source
             WHERE l.name = ? AND (s.name = ? OR ? IS NULL OR s.name IS NULL)
             LIMIT 1`,
            [title, site || null, site || null]
        );

        if (!manga) return res.json({ inLibrary: false });

        const usage = await db.get(
            `SELECT 1 FROM libraryusage WHERE id_library = ? AND name_client = ?`,
            [manga.id, req.user.username]
        );

        res.json({ inLibrary: Boolean(usage) });
    } catch (error) {
        console.error('❌ Erreur lors de la vérification bibliothèque:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    } finally {
        await db.close();
    }
});

router.get('/user', authenticate, async (req, res) => {
    const db = await openDb();
    try {
        const rows = await db.all(
            `SELECT 
                l.id,
                l.name AS title,
                l.author,
                l.theme,
                l.status,
                l.description,
                l.cover_path AS coverPath,
                l.cover_url AS coverUrl,
                lc.chapter AS lastChapter,
                lc.url AS chapterUrl,
                ls.url AS mangaUrl,
                s.name AS site,
                lu.last_chapter AS userLastChapter,
                lu.reading_status AS readingStatus
             FROM libraryusage lu
             JOIN Library l ON lu.id_library = l.id
             LEFT JOIN LibrarySource ls ON l.id = ls.id_library
             LEFT JOIN Source s ON ls.id_source = s.id_source
             LEFT JOIN LastChapters lc ON lc.id_library = l.id AND lc.id_source = ls.id_source
             WHERE lu.name_client = ?
             GROUP BY l.id`,
            [req.user.username]
        );

        res.json(rows || []);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la bibliothèque:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    } finally {
        await db.close();
    }
});

    router.patch('/user', authenticate, async (req, res) => {
        const { id, lastChapter, readingStatus, title, site } = req.body;

        const db = await openDb();
        try {
            let id_library = id;

            // If no id provided, try to resolve by title (+ site if available)
            if (!id_library) {
                if (!title) return res.status(400).json({ message: 'id or title requis' });

                const mangaRow = await db.get(
                    `SELECT l.id FROM Library l
                     LEFT JOIN LibrarySource ls ON l.id = ls.id_library
                     LEFT JOIN Source s ON ls.id_source = s.id_source
                     WHERE l.name = ? AND (s.name = ? OR ? IS NULL OR s.name IS NULL)
                     LIMIT 1`,
                    [title, site || null, site || null]
                );

                if (!mangaRow) return res.status(404).json({ message: 'Manga introuvable' });
                id_library = mangaRow.id;
            }

            const existing = await db.get(
                `SELECT 1 FROM libraryusage WHERE id_library = ? AND name_client = ?`,
                [id_library, req.user.username]
            );

            if (existing) {
                await db.run(
                    `UPDATE libraryusage SET last_chapter = COALESCE(?, last_chapter), reading_status = COALESCE(?, reading_status) WHERE id_library = ? AND name_client = ?`,
                    [lastChapter || null, readingStatus || null, id_library, req.user.username]
                );
            } else {
                await db.run(
                    `INSERT INTO libraryusage (id_library, name_client, last_chapter, reading_status) VALUES (?, ?, ?, ?)`,
                    [id_library, req.user.username, lastChapter || null, readingStatus || null]
                );
            }

            res.json({ message: 'Mise à jour enregistrée', idLibrary: id_library });
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour de la bibliothèque utilisateur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        } finally {
            await db.close();
        }
    });

// DELETE endpoint - remove manga from user library
router.delete('/user', authenticate, async (req, res) => {
    const { title, site } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Title requis' });
    }

    const db = await openDb();

    try {
        // Find the library entry by title (and site if provided)
        const mangaRow = await db.get(
            `SELECT l.id FROM Library l
             LEFT JOIN LibrarySource ls ON l.id = ls.id_library
             LEFT JOIN Source s ON ls.id_source = s.id_source
             WHERE l.name = ? AND (s.name = ? OR ? IS NULL OR s.name IS NULL)
             LIMIT 1`,
            [title, site || null, site || null]
        );

        if (!mangaRow) {
            return res.status(404).json({ message: 'Manga introuvable dans votre bibliothèque' });
        }

        const id_library = mangaRow.id;

        // Delete from libraryusage table
        await db.run(
            `DELETE FROM libraryusage WHERE id_library = ? AND name_client = ?`,
            [id_library, req.user.username]
        );

        res.json({ message: 'Manga supprimé de votre bibliothèque' });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du manga utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    } finally {
        await db.close();
    }
});

export default router;
