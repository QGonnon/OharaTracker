import { saveChapter } from '../utils/index.js';
import { downloadCover } from '../utils/cover.js';

async function asura(page) {
    const url = 'https://asuracomic.net/';
    try {
        const response = await page.goto(url, { waitUntil: 'networkidle2' });
        if (!response || response.status() !== 200) {
            console.warn(`⚠️ Erreur ${response?.status()} lors de l'accès à ${url}`);
            return;
        }

        // Extraire directement les infos depuis Latest Updates sans visiter chaque page
        const mangaList = await page.evaluate(() => {
            const selector = 'body > div.max-w-\\[1220px\\].pt-2 > div > div > div > div > div.w-\\[100\\%\\].float-left.min-\\[882px\\]\\:w-\\[70\\%\\].max-\\[600px\\]\\:w-\\[100\\%\\] > div > div > div.text-white.mb-1.md\\:mb-5.mt-5 > div.grid.grid-rows-1.grid-cols-1.sm\\:grid-cols-2.bg-\\[\\#222222\\].p-3.pb-0';
            const grid = document.querySelector(selector);
            
            if (!grid) return [];

            const mangas = [];
            const seen = new Set();
            
            // Parcourir les éléments de la grille
            const items = grid.children;
            
            for (const item of items) {
                // Chercher tous les liens dans cet item
                const allLinks = Array.from(item.querySelectorAll('a'));
                
                // Trouver le lien de série (celui sans /chapter/) qui a du texte
                let seriesUrl = null;
                let title = null;
                
                for (const link of allLinks) {
                    const href = link.href;
                    const text = link.innerText?.trim();
                    
                    if (href.includes('/series/') && !href.includes('/chapter/') && text && text.length > 0) {
                        seriesUrl = href.split('#')[0].split('?')[0];
                        title = text;
                        break;
                    }
                }
                
                if (!seriesUrl || !title) continue;
                
                if (seen.has(seriesUrl)) continue;
                seen.add(seriesUrl);
                
                // Chercher la couverture dans cet item
                const img = item.querySelector('img');
                const coverUrl = img?.src || null;
                
                // Chercher le dernier chapitre parmi les liens de chapitre
                const chapterLinks = Array.from(item.querySelectorAll('a[href*="/chapter/"]'));
                let lastChapter = 'N/A';
                let lastChapterLink = null;
                
                if (chapterLinks.length > 0) {
                    let maxNum = -Infinity;
                    for (const ch of chapterLinks) {
                        const m = ch.href.match(/chapter\/(\d+)/i);
                        if (m) {
                            const num = parseInt(m[1], 10);
                            if (!isNaN(num) && num > maxNum) {
                                maxNum = num;
                                lastChapterLink = ch.href;
                            }
                        }
                    }
                    if (maxNum > -Infinity) lastChapter = String(maxNum);
                }
                
                mangas.push({
                    title,
                    seriesUrl,
                    coverUrl,
                    lastChapter,
                    lastChapterLink: lastChapterLink || seriesUrl
                });
            }
            
            return mangas;
        });

        console.log(`📚 Found ${mangaList.length} manga in Latest Updates`);
        
        for (const manga of mangaList) {
            try {
                // Normalise le titre
                const mangaTitle = manga.title
                    .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
                    .replace(/[-–—]\s*Asura(?:\s*Scans?)?\s*$/i, '')
                    .replace(/\s*Asura(?:\s*Scans?)?\s*$/i, '')
                    .replace(/\s*-\s*$/,'')
                    .trim();

                const mangaInfo = {
                    title: mangaTitle,
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

                // Télécharge la couverture si disponible
                if (manga.coverUrl) {
                    const coverFileName = `asura-${mangaTitle.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                    const coverPath = await downloadCover(manga.coverUrl, coverFileName);
                    if (coverPath) {
                        mangaInfo.coverPath = coverPath;
                        mangaInfo.coverUrl = manga.coverUrl;
                    }
                }

                
                await saveChapter('asuracomic', manga.lastChapter, manga.lastChapterLink, manga.seriesUrl, mangaInfo);
                
            } catch (e) {
                console.warn(`  ⚠️ Erreur avec ${manga.title}:`, e.message);
                continue;
            }
        }

        console.log('✅ Scraping Asura terminé.');

    } catch (error) {
        console.error(`❌ Erreur lors du scraping d'Asura: ${error}`);
    }
}

export { asura };
