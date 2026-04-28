import fetch from 'node-fetch';
import { saveChapter } from '../utils/index.js';
import { downloadCover } from '../utils/cover.js';

const ANILIST_GRAPHQL = 'https://graphql.anilist.co';
const JIKAN_API = 'https://api.jikan.moe/v4';

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

// Fonction pour rechercher les infos d'un manga sur Jikan (MyAnimeList)
async function searchJikanManga(title) {
    if (!title) return null;

    try {
        const res = await fetch(`${JIKAN_API}/manga?q=${encodeURIComponent(title)}&limit=3`);
        if (!res.ok) return null;

        const json = await res.json();
        const results = json.data;
        if (!results || results.length === 0) return null;

        const manga = results[0];

        const authors = manga.authors?.map(a => a.name).join(', ') || null;

        const tags = [
            ...(manga.genres || []).map(g => ({ name: g.name, type: 'genre' })),
            ...(manga.themes || []).map(t => ({ name: t.name, type: 'theme' })),
            ...(manga.demographics || []).map(d => ({ name: d.name, type: 'demographic' }))
        ];

        const publishedYear = manga.published?.from
            ? new Date(manga.published.from).getFullYear().toString()
            : null;

        return {
            description: manga.synopsis || null,
            type: manga.type || null,
            demographic: manga.demographics?.[0]?.name || null,
            published: publishedYear,
            status: manga.status || null,
            author: authors,
            artist: null,
            theme: manga.themes?.map(t => t.name).join(', ') || null,
            publishers: manga.serializations?.map(s => s.name).join(', ') || null,
            tags,
            coverUrl: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || null
        };
    } catch (error) {
        console.warn(`⚠️ Erreur lors de la recherche Jikan pour "${title}":`, error.message);
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
            // Récupérer les infos complètes depuis Jikan (MAL)
            const jikanInfo = await searchJikanManga(m.mangaName);
            // Respecter le rate-limit Jikan (3 req/s)
            await new Promise(r => setTimeout(r, 400));

            const mangaInfo = {
                title: m.mangaName,
                description: jikanInfo?.description || null,
                type: jikanInfo?.type || null,
                demographic: jikanInfo?.demographic || null,
                published: jikanInfo?.published || null,
                status: jikanInfo?.status || null,
                artist: jikanInfo?.artist || null,
                author: jikanInfo?.author || null,
                theme: jikanInfo?.theme || null,
                publishers: jikanInfo?.publishers || null,
                tags: jikanInfo?.tags || []
            };


            // Priorité cover: AniList → Jikan (MAL) → scan-manga (thumbnail à éviter)
            let coverPath = null;

            const anilistCoverUrl = await searchAniListManga(m.mangaName);

            if (anilistCoverUrl) {
                const coverFileName = `anilist-${m.coverName}.jpg`;
                coverPath = await downloadCover(anilistCoverUrl, coverFileName);
                if (coverPath) {
                    mangaInfo.coverPath = coverPath;
                    mangaInfo.coverUrl = anilistCoverUrl;
                }
            }

            if (!coverPath && jikanInfo?.coverUrl) {
                const coverFileName = `jikan-${m.coverName}.jpg`;
                coverPath = await downloadCover(jikanInfo.coverUrl, coverFileName);
                if (coverPath) {
                    mangaInfo.coverPath = coverPath;
                    mangaInfo.coverUrl = jikanInfo.coverUrl;
                }
            }

            if (!coverPath && m.coverUrl) {
                const coverFileName = `scan-manga-${m.coverName}.jpg`;
                coverPath = await downloadCover(m.coverUrl, coverFileName);
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