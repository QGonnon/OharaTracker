import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Stockage des couvertures dans /cdn à la racine du projet
const CDN_DIR = path.resolve(__dirname, '../..', 'cdn');

// --- Connexion SQLite ---
async function openDb() {
    return open({
        filename: './manga.db', // 🔧 adapte selon ton projet
        driver: sqlite3.Database
    });
}

// --- Télécharge la cover dans le dossier cdn ---
async function downloadCover(coverUrl, coverFileName) {
    if (!coverUrl || !coverFileName) return null;

    await fs.mkdir(CDN_DIR, { recursive: true });
    const targetPath = path.join(CDN_DIR, coverFileName);

    try {
        await fs.access(targetPath);
        return coverFileName; // Déjà présent
    } catch (_) {
        // continue pour télécharger
    }

    try {
        const response = await fetch(coverUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(targetPath, buffer);
        return coverFileName;
    } catch (error) {
        console.error(`❌ Erreur lors du téléchargement de la cover ${coverUrl}:`, error);
        return null;
    }
}

// --- Récupération complète des infos du manga ---
async function getMangaInfo(mangaId) {
    const apiUrl = `https://api.mangadex.org/manga/${mangaId}?includes[]=author&includes[]=artist&includes[]=cover_art`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const mangaData = await response.json();
        const attributes = mangaData.data.attributes;
        const relationships = mangaData.data.relationships;

        const title = attributes.title.fr || attributes.title.en || attributes.title[Object.keys(attributes.title)[0]];
        const description = attributes.description.fr || attributes.description.en || '';
        const type = attributes.originalLanguage || 'N/A';
        const demographic = attributes.publicationDemographic || 'N/A';
        const published = attributes.year || 'N/A';
        const status = attributes.status || 'N/A';

        const author = relationships.find(r => r.type === 'author')?.attributes?.name || 'Inconnu';
        const artist = relationships.find(r => r.type === 'artist')?.attributes?.name || 'Inconnu';

        const theme = attributes.tags.map(tag => tag.attributes.name.en).join(', ') || '';
        const tags = attributes.tags.map(tag => ({
            name: tag.attributes.name.en || tag.attributes.name.fr || 'N/A',
            type: tag.attributes.group || 'general'
        }));

        const coverRelation = relationships.find(r => r.type === 'cover_art');
        const coverFileName = coverRelation?.attributes?.fileName;
        const coverUrl = coverFileName ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}` : null;

        return {
            title,
            description,
            type,
            demographic,
            published,
            status,
            artist,
            author,
            theme,
            publishers: 'N/A',
            tags,
            coverUrl,
            coverFileName
        };

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération des infos du manga : ${error}`);
        return null;
    }
}

// --- Enregistre le manga, ses tags, et le dernier chapitre ---
async function saveChapter(sourceName, lastChapter, chapterUrl, mangaUrl, mangaInfo) {
    const db = await openDb();

    try {
        // 1️⃣ Vérifie ou crée la source
        let source = await db.get('SELECT id_source FROM Source WHERE name = ?', [sourceName]);
        if (!source) {
            await db.run('INSERT INTO Source (name) VALUES (?)', [sourceName]);
            source = await db.get('SELECT id_source FROM Source WHERE name = ?', [sourceName]);
        }

        // 2️⃣ Vérifie si le manga existe déjà
        let library = await db.get('SELECT id, cover_path, cover_url FROM Library WHERE name = ?', [mangaInfo.title]);
        if (!library) {
            await db.run(
                `INSERT INTO Library (name, description, type, demographic, published, status, artist, author, theme, publishers, cover_path, cover_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    mangaInfo.title,
                    mangaInfo.description,
                    mangaInfo.type,
                    mangaInfo.demographic,
                    mangaInfo.published,
                    mangaInfo.status,
                    mangaInfo.artist,
                    mangaInfo.author,
                    mangaInfo.theme,
                    mangaInfo.publishers,
                    mangaInfo.coverPath || null,
                    mangaInfo.coverUrl || null
                ]
            );
            library = await db.get('SELECT id, cover_path, cover_url FROM Library WHERE name = ?', [mangaInfo.title]);
        } else {
            // Met à jour la cover si non présente
            if (!library.cover_path && (mangaInfo.coverPath || mangaInfo.coverUrl)) {
                await db.run(
                    `UPDATE Library SET cover_path = COALESCE(?, cover_path), cover_url = COALESCE(?, cover_url) WHERE id = ?`,
                    [mangaInfo.coverPath || null, mangaInfo.coverUrl || null, library.id]
                );
                library = await db.get('SELECT id, cover_path, cover_url FROM Library WHERE name = ?', [mangaInfo.title]);
            }
        }

        // 3️⃣ Insertion des tags
        for (const tag of mangaInfo.tags) {
            const exists = await db.get(
                'SELECT id FROM Tag WHERE name = ? AND id_library = ?',
                [tag.name, library.id]
            );
            if (!exists) {
                await db.run(
                    'INSERT INTO Tag (name, type, id_library) VALUES (?, ?, ?)',
                    [tag.name, tag.type, library.id]
                );
            }
        }

        // 4️⃣ Liaison Library ↔ Source
        const existingLink = await db.get(
            `SELECT url FROM LibrarySource WHERE id_library = ? AND id_source = ?`,
            [library.id, source.id_source]
        );

        if (!existingLink) {
            // 📌 La liaison n'existe pas → on insère
            await db.run(
                `INSERT INTO LibrarySource (id_library, id_source, url)
                VALUES (?, ?, ?)`,
                [library.id, source.id_source, mangaUrl]
            );
        }

        // 5️⃣ Enregistrement du dernier chapitre (remplace si existe déjà)
        await db.run(
            `INSERT OR REPLACE INTO LastChapters (id_library, id_source, chapter, url)
            VALUES (?, ?, ?, ?)`,
            [library.id, source.id_source, lastChapter, chapterUrl]
        );
    } catch (err) {
        console.error('❌ Erreur lors de la sauvegarde :', err);
    } finally {
        await db.close();
    }
}

// --- Scraping MangaDex ---
async function mangadex() {
    const baseUrl = 'https://api.mangadex.org/';
    const chapterUrl = `${baseUrl}chapter?limit=20&translatedLanguage[]=fr&translatedLanguage[]=en&order[createdAt]=desc`;

    try {
        const response = await fetch(chapterUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const chapters = data.data || [];

        for (const chapter of chapters) {
            const lastChapter = chapter.attributes.chapter || 'N/A';
            const chapterId = chapter.id;
            const chapterUrlFull = `https://mangadex.org/chapter/${chapterId}`;

            const mangaId = chapter.relationships.find(rel => rel.type === 'manga')?.id;
            if (!mangaId) continue;

            const mangaUrl = `https://mangadex.org/title/${mangaId}`;

            const mangaInfo = await getMangaInfo(mangaId);
            if (!mangaInfo) continue;

            // Téléchargement et stockage local de la cover
            const coverPath = await downloadCover(mangaInfo.coverUrl, mangaInfo.coverFileName);
            if (coverPath) {
                mangaInfo.coverPath = coverPath; // store filename only
            }

            await saveChapter('MangaDex', lastChapter, chapterUrlFull, mangaUrl, mangaInfo);
        }

    } catch (error) {
        console.error(`❌ Erreur MangaDex: ${error}`);
    }
}

export { mangadex };
