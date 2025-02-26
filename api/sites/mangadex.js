import fetch from 'node-fetch';
import { saveChapter } from '../utils/index.js';

// Fonction pour récupérer le titre du manga à partir de son URL
async function getMangaTitle(mangaUrl) {
    const mangaIdMatch = mangaUrl.match(/title\/([a-f0-9-]+)/);
    if (!mangaIdMatch) {
        console.error("❌ ID de manga introuvable dans l'URL !");
        return 'Titre inconnu';
    }

    const mangaId = mangaIdMatch[1];
    const apiUrl = `https://api.mangadex.org/manga/${mangaId}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const mangaData = await response.json();
        const attributes = mangaData.data.attributes;

        // Priorité au titre en français, sinon en anglais
        let mangaTitle = attributes.title.fr || attributes.title.en || 'Titre inconnu';

        // Vérification des titres alternatifs (altTitles)
        if (attributes.altTitles.length > 0) {
            const altTitleFr = attributes.altTitles.find(title => title.fr)?.fr;
            if (altTitleFr) mangaTitle = altTitleFr;
        }

        return mangaTitle;
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du titre : ${error}`);
        return 'Titre inconnu';
    }
}

async function mangadex() {
    const baseUrl = 'https://api.mangadex.org/';
    const chapterUrl = `${baseUrl}chapter?limit=10&translatedLanguage[]=fr&order[createdAt]=desc`;
    
    try {
        const response = await fetch(chapterUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const chapters = data.data || [];

        for (const chapter of chapters) {
            const lastChapter = chapter.attributes.chapter || 'N/A';
            const chapterId = chapter.id;
            const chapterUrl = `https://mangadex.org/chapter/${chapterId}`;
            
            // Récupération de l'ID du manga lié au chapitre
            const mangaId = chapter.relationships.find(rel => rel.type === 'manga')?.id;
            if (!mangaId) continue;

            const mangaUrl = `https://mangadex.org/title/${mangaId}`;

            // Récupération du titre du manga
            const mangaTitle = await getMangaTitle(mangaUrl);

            // Enregistrement avec le bon titre
            saveChapter('MangaDex',  lastChapter, chapterUrl, mangaUrl, mangaTitle);
        }

        console.log('✅ Scraping MangaDex terminé.');
    } catch (error) {
        console.error(`❌ Erreur MangaDex: ${error}`);
    }
}

export { mangadex };
