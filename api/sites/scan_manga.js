import { saveChapter } from '../utils/index.js';
import { downloadCover } from '../utils/cover.js';

async function scan_manga(page) {
    const url = 'https://www.scan-manga.com/?po';
    try {
        const response = await page.goto(url);
        if (response.status() != 200) {
            console.warn(`⚠️ Erreur ${response.status()} lors de l'accès à ${url}`);
            return;
        }
        const mangas = await page.evaluate(()=>{
            const mangaList = document.querySelectorAll('#content_news > article.top_body');
            return Array.from(mangaList).slice(0, 10).map((element)=>{
                const mangaElement = element.querySelector('a.nom_manga');
                const chapterElement = element.querySelector('a.lel_tchapt');
                const coverElement = element.querySelector('img');
                if (mangaElement && chapterElement) {
                    return {
                        chapter: chapterElement.innerText.trim().split(' ').slice(-1)[0],
                        chapterLink: chapterElement.href,
                        mangaLink: mangaElement.href,
                        mangaName: mangaElement.innerText.trim(),
                        coverUrl: coverElement?.src || null
                    }
                }
            })
        })
        for (const m of mangas) {
            const mangaInfo = {
                title: m.mangaName,
                description: null,
                type: null,
                demographic: null,
                published: null,
                status: null,
                artist: null,
                author: null,
                theme: null,
                publishers: null,
                tags: []
            };

            // Téléchargement de la cover si disponible
            if (m.coverUrl) {
                const coverFileName = `scan-manga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
                const coverPath = await downloadCover(m.coverUrl, coverFileName);
                if (coverPath) {
                    mangaInfo.coverPath = coverPath;
                    mangaInfo.coverUrl = m.coverUrl;
                }
            }

            await saveChapter('scan-manga', m.chapter, m.chapterLink, m.mangaLink, mangaInfo);
        }
        console.log('✅ Scraping Scan-manga terminé.');

    } catch (error) {
        console.error(`❌ Erreur lors du scraping de Scan-manga: ${error}`);
    }
}

export { scan_manga };