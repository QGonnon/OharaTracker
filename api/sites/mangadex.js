import fetch from 'node-fetch';
import { saveChapter } from '../utils/index.js';

async function mangadex() {
    const url = 'https://api.mangadex.org/chapter?limit=10&translatedLanguage[]=fr&order[createdAt]=desc';
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const chapters = data.data || [];
            chapters.forEach((chapter) => {
                const lastChapter = chapter.attributes.chapter || 'N/A'
                const chapterUrl = `https://mangadex.org/chapter/${chapter.id}`
                const mangaUrl = `https://mangadex.org/title/${chapter.relationships[1]?.id}`
                saveChapter('MangaDex', lastChapter, chapterUrl, mangaUrl);
            });
            console.log('✅ Scraping MangaDex terminé.');
        }
    } catch (error) {
        console.error(`❌ Erreur MangaDex: ${error}`);
    }
}

export { mangadex };