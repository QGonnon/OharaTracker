import express from 'express';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../utils/database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

    try {
        // Ensure source exists
        let sources = await sequelize.query(
            'SELECT id_source FROM "Source" WHERE name = :site LIMIT 1',
            { replacements: { site }, type: QueryTypes.SELECT }
        );
        if (sources.length === 0) {
            await sequelize.query(
                'INSERT INTO "Source" (name) VALUES (:site)',
                { replacements: { site }, type: QueryTypes.INSERT }
            );
            sources = await sequelize.query(
                'SELECT id_source FROM "Source" WHERE name = :site LIMIT 1',
                { replacements: { site }, type: QueryTypes.SELECT }
            );
        }
        const id_source = sources[0].id_source;

        // Upsert manga in Library
        let libraries = await sequelize.query(
            'SELECT id FROM "Library" WHERE name = :title LIMIT 1',
            { replacements: { title }, type: QueryTypes.SELECT }
        );

        let id_library;
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
                        coverUrl: coverUrl || null
                    },
                    type: QueryTypes.INSERT
                }
            );
            libraries = await sequelize.query(
                'SELECT id FROM "Library" WHERE name = :title LIMIT 1',
                { replacements: { title }, type: QueryTypes.SELECT }
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
                        id: libraries[0].id
                    },
                    type: QueryTypes.UPDATE
                }
            );
        }
        id_library = libraries[0].id;

        // Link Library to Source
        await sequelize.query(
            `INSERT INTO "LibrarySource" (id_library, id_source, url) VALUES (:id_library, :id_source, :url)
             ON CONFLICT (id_library, id_source) DO UPDATE SET url = EXCLUDED.url`,
            {
                replacements: { id_library, id_source, url: mangaUrl || null },
                type: QueryTypes.INSERT
            }
        );

        // Save last known chapter if provided
        if (lastChapter || chapterUrl) {
            await sequelize.query(
                `INSERT INTO "Chapters" (id_library, id_source, chapter, url) VALUES (:id_library, :id_source, :chapter, :url)
                 ON CONFLICT (id_library, id_source, chapter) DO UPDATE SET url = EXCLUDED.url`,
                {
                    replacements: {
                        id_library,
                        id_source,
                        chapter: lastChapter || null,
                        url: chapterUrl || null
                    },
                    type: QueryTypes.INSERT
                }
            );
        }

        // Attach manga to the current user
        const existing = await sequelize.query(
            'SELECT 1 FROM libraryusage WHERE id_library = :id_library AND name_client = :username LIMIT 1',
            { replacements: { id_library, username: req.user.username }, type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Déjà dans votre bibliothèque.' });
        }

        await sequelize.query(
            'INSERT INTO libraryusage (id_library, name_client) VALUES (:id_library, :username)',
            { replacements: { id_library, username: req.user.username }, type: QueryTypes.INSERT }
        );

        res.json({ message: 'Manga ajouté à votre bibliothèque', idLibrary: id_library });
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout à la bibliothèque:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du manga' });
    }
});

router.get('/status', authenticate, async (req, res) => {
    const { title, site } = req.query;
    if (!title) return res.status(400).json({ message: 'Titre requis' });

    try {
        const mangas = await sequelize.query(
            `SELECT l.id
             FROM "Library" l
             LEFT JOIN "LibrarySource" ls ON l.id = ls.id_library
             LEFT JOIN "Source" s ON ls.id_source = s.id_source
             WHERE l.name = :title AND (:site IS NULL OR s.name = :site OR s.name IS NULL)
             LIMIT 1`,
            { replacements: { title, site: site || null }, type: QueryTypes.SELECT }
        );

        if (mangas.length === 0) return res.json({ inLibrary: false });

        const usage = await sequelize.query(
            'SELECT 1 FROM libraryusage WHERE id_library = :id AND name_client = :username LIMIT 1',
            { replacements: { id: mangas[0].id, username: req.user.username }, type: QueryTypes.SELECT }
        );

        res.json({ inLibrary: usage.length > 0 });
    } catch (error) {
        console.error('❌ Erreur lors de la vérification bibliothèque:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.get('/user', authenticate, async (req, res) => {
    try {
        const rows = await sequelize.query(
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
                lu.reading_status AS "readingStatus"
             FROM libraryusage lu
             JOIN "Library" l ON lu.id_library = l.id
             LEFT JOIN "LibrarySource" ls ON l.id = ls.id_library
             LEFT JOIN "Source" s ON ls.id_source = s.id_source
             LEFT JOIN "Chapters" lc ON lc.id_library = l.id AND lc.id_source = ls.id_source
             WHERE lu.name_client = :username
             ORDER BY l.id`,
            { replacements: { username: req.user.username }, type: QueryTypes.SELECT }
        );

        res.json(rows || []);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la bibliothèque:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.patch('/user', authenticate, async (req, res) => {
    const { id, lastChapter, readingStatus, title, site } = req.body;

    try {
        let id_library = id;

        if (!id_library) {
            if (!title) return res.status(400).json({ message: 'id or title requis' });

            const mangas = await sequelize.query(
                `SELECT l.id FROM "Library" l
                 LEFT JOIN "LibrarySource" ls ON l.id = ls.id_library
                 LEFT JOIN "Source" s ON ls.id_source = s.id_source
                 WHERE l.name = :title AND (:site IS NULL OR s.name = :site OR s.name IS NULL)
                 LIMIT 1`,
                { replacements: { title, site: site || null }, type: QueryTypes.SELECT }
            );

            if (mangas.length === 0) return res.status(404).json({ message: 'Manga introuvable' });
            id_library = mangas[0].id;
        }

        const existing = await sequelize.query(
            'SELECT 1 FROM libraryusage WHERE id_library = :id_library AND name_client = :username LIMIT 1',
            { replacements: { id_library, username: req.user.username }, type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            await sequelize.query(
                `UPDATE libraryusage
                 SET last_chapter = COALESCE(:lastChapter, last_chapter),
                     reading_status = COALESCE(:readingStatus, reading_status)
                 WHERE id_library = :id_library AND name_client = :username`,
                {
                    replacements: {
                        lastChapter: lastChapter || null,
                        readingStatus: readingStatus || null,
                        id_library,
                        username: req.user.username
                    },
                    type: QueryTypes.UPDATE
                }
            );
        } else {
            await sequelize.query(
                'INSERT INTO libraryusage (id_library, name_client, last_chapter, reading_status) VALUES (:id_library, :username, :lastChapter, :readingStatus)',
                {
                    replacements: {
                        id_library,
                        username: req.user.username,
                        lastChapter: lastChapter || null,
                        readingStatus: readingStatus || null
                    },
                    type: QueryTypes.INSERT
                }
            );
        }

        res.json({ message: 'Mise à jour enregistrée', idLibrary: id_library });
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de la bibliothèque utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.delete('/user', authenticate, async (req, res) => {
    const { title, site } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Title requis' });
    }

    try {
        const mangas = await sequelize.query(
            `SELECT l.id FROM "Library" l
             LEFT JOIN "LibrarySource" ls ON l.id = ls.id_library
             LEFT JOIN "Source" s ON ls.id_source = s.id_source
             WHERE l.name = :title AND (:site IS NULL OR s.name = :site OR s.name IS NULL)
             LIMIT 1`,
            { replacements: { title, site: site || null }, type: QueryTypes.SELECT }
        );

        if (mangas.length === 0) {
            return res.status(404).json({ message: 'Manga introuvable dans votre bibliothèque' });
        }

        const id_library = mangas[0].id;

        await sequelize.query(
            'DELETE FROM libraryusage WHERE id_library = :id_library AND name_client = :username',
            { replacements: { id_library, username: req.user.username }, type: QueryTypes.DELETE }
        );

        res.json({ message: 'Manga supprimé de votre bibliothèque' });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du manga utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
