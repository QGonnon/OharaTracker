import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// --- Connexion SQLite ---
async function openDb() {
    return open({
        filename: './manga.db', // 🔧 adapte selon ton projet
        driver: sqlite3.Database
    });
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

        const title = attributes.title.fr || attributes.title.en || 'Titre inconnu';
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
            tags
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
        let library = await db.get('SELECT id FROM Library WHERE name = ?', [mangaInfo.title]);
        if (!library) {
            await db.run(
                `INSERT INTO Library (name, description, type, demographic, published, status, artist, author, theme, publishers)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    mangaInfo.publishers
                ]
            );
            library = await db.get('SELECT id FROM Library WHERE name = ?', [mangaInfo.title]);
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
    // 🔥 On prend les 20 derniers chapitres FR et EN
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

            await saveChapter('MangaDex', lastChapter, chapterUrlFull, mangaUrl, mangaInfo);
        }

    } catch (error) {
        console.error(`❌ Erreur MangaDex: ${error}`);
    }
}

export { mangadex };
