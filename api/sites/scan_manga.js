import { saveChapter } from '../utils/index.js';

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
                if (mangaElement && chapterElement) {
                    return {
                        chapter: chapterElement.innerText.trim().split(' ').slice(-1)[0],
                        chapterLink: chapterElement.href,
                        mangaLink: mangaElement.href,
                        mangaName: mangaElement.innerText.trim()
                    }
                }
            })
        })
        mangas.forEach(m=>saveChapter('scan-manga', m.chapter, m.chapterLink, m.mangaLink, m.mangaName));
        console.log('✅ Scraping Scan-manga terminé.');

    } catch (error) {
        console.error(`❌ Erreur lors du scraping de Scan-manga: ${error}`);
    }
}

export { scan_manga };