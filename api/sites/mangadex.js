import fetch from 'node-fetch';
import { saveChapter } from '../utils/database.js';
import { downloadCover } from '../utils/cover.js';

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
        let type = null;
        switch (attributes.originalLanguage) {
            case "ja":
                type = "MANGA"
                break;
            case "ko":
                type = "MANHWA"
                break;
            case "zh":
                type = "MANHUA"
                break;
        }
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
        console.log(`✅ Scraped MangaDex terminé.`);

    } catch (error) {
        console.error(`❌ Erreur MangaDex: ${error}`);
    }
}

export { mangadex };
