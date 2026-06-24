import fetch from 'node-fetch';
import { saveChapter } from '../utils/index.js';
import { downloadCover } from '../utils/cover.js';

const ANILIST_GRAPHQL = 'https://graphql.anilist.co';

// Fonction pour rechercher un manga sur AniList par titre
async function searchAniListManga(title) {
    if (!title) return null;

    try {
        const query = `query ($search: String) {
            Media(search: $search, type: MANGA) {
                id
                title {
                    romaji
                    english
                    native
                }
                coverImage {
                    large
                    medium
                }
                siteUrl
            }
        }`;

        const res = await fetch(ANILIST_GRAPHQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables: { search: title } })
        });

        if (!res.ok) return null;
        const json = await res.json();
        
        if (json.errors || !json.data?.Media) return null;

        // Retourner l'URL de la couverture
        const coverUrl = json.data.Media.coverImage?.large || json.data.Media.coverImage?.medium;
        return coverUrl || null;

    } catch (error) {
        console.warn(`⚠️ Erreur lors de la recherche AniList pour "${title}":`, error.message);
        return null;
    }
}

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
                        coverUrl: coverElement?.src || null,
                        coverName: (coverElement?.alt || '')
                            .replace(/\s+/g, '-')
                            .toLowerCase() || null
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

            // Chercher d'abord une couverture de meilleure qualité sur AniList
            let coverUrl = null;
            let coverPath = null;

            
            const anilistCoverUrl = await searchAniListManga(m.mangaName);
            
            if (anilistCoverUrl) {
                
                const coverFileName = `anilist-${m.coverName}.jpg`;
                coverPath = await downloadCover(anilistCoverUrl, coverFileName);
                if (coverPath) {
                    mangaInfo.coverPath = coverPath;
                    mangaInfo.coverUrl = anilistCoverUrl;
                }
            } else {
                // Fallback: utiliser la couverture du site scan-manga
                
                if (m.coverUrl) {
                    const coverFileName = `scan-manga-${m.coverName}.jpg`;
                    coverPath = await downloadCover(m.coverUrl, coverFileName);
                    if (coverPath) {
                        mangaInfo.coverPath = coverPath;
                        mangaInfo.coverUrl = m.coverUrl;
                    }
                }
            }
            mangaInfo.type = "MANGA";
            await saveChapter('scan-manga', m.chapter, m.chapterLink, m.mangaLink, mangaInfo);
        }
        console.log('✅ Scraping Scan-manga terminé.');

    } catch (error) {
        console.error(`❌ Erreur lors du scraping de Scan-manga: ${error}`);
    }
}

export { scan_manga };