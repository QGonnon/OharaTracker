import fetch from 'node-fetch';
import { saveChapter } from '../utils/index.js';
import { downloadCover } from '../utils/cover.js';

const ANILIST_GRAPHQL = 'https://graphql.anilist.co';

// Simple in-memory cache
let _cache = {
    ts: 0,
    data: null
};
const TTL = 1000 * 60 * 30; // 30 minutes

async function queryAniList(query, variables = {}) {
    const res = await fetch(ANILIST_GRAPHQL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`AniList request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data;
}

async function fetchPopularAnime() {
    if (Date.now() - _cache.ts < TTL && _cache.data) return _cache.data;
    // Deprecated: previously fetched by popularity. Now prefer latest airing schedules
    return fetchLatestAnimes();
}

async function fetchLatestAnimes() {
    if (Date.now() - _cache.ts < TTL && _cache.data) return _cache.data;

    const query = `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            airingSchedules(sort: TIME_DESC) {
                episode
                airingAt
                media {
                    id
                    title { romaji english native }
                    coverImage { large medium }
                    siteUrl
                    episodes
                    status
                    description
                    studios { nodes { id name } }
                    staff { edges { role node { id name { full } } } }
                }
            }
        }
    }`;

    // We request a larger perPage to collect recent schedules
    const data = await queryAniList(query, { page: 1, perPage: 100 });
    const schedules = data?.Page?.airingSchedules || [];

    // Aggregate by media id and keep the highest episode that has already aired
    const nowTs = Math.floor(Date.now() / 1000);
    const mediaMap = new Map();

    for (const s of schedules) {
        if (!s || !s.media) continue;
        const mediaId = s.media.id;
        const airingAt = s.airingAt || 0;
        const episode = Number(s.episode) || 0;

        // Only consider items that have already aired
        if (airingAt > nowTs) continue;

        const existing = mediaMap.get(mediaId);
        if (!existing) {
            mediaMap.set(mediaId, { media: s.media, lastEpisode: episode });
        } else {
            if (episode > existing.lastEpisode) existing.lastEpisode = episode;
        }
    }

    // Convert to array of media objects with lastEpisode
    const medias = [];
    for (const [id, obj] of mediaMap.entries()) {
        medias.push({ ...obj.media, lastEpisode: String(obj.lastEpisode) });
    }

    // Fallback: if no schedules returned, fall back to popularity fetch (smaller set)
    if (medias.length === 0) {
        const fallbackQuery = `query ($page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(type: ANIME, sort: START_DATE_DESC, isAdult: false) { id title { romaji english native } coverImage { large medium } siteUrl episodes status description nextAiringEpisode { episode airingAt } studios { nodes { id name } } staff { edges { role node { id name { full } } } } } } }`;
        const fb = await queryAniList(fallbackQuery, { page: 1, perPage: 50 });
        const fbMedias = fb?.Page?.media || [];
        for (const m of fbMedias) {
            medias.push(m);
        }
    }

    _cache = { ts: Date.now(), data: medias };
    return medias;
}

async function anilist(page) {
    try {
        console.log('🔍 Fetching AniList popular anime...');
        const medias = await fetchPopularAnime();

        for (const m of medias) {
            try {
                const title = m.title?.english || m.title?.romaji || m.title?.native || `Anime ${m.id}`;
                const coverUrl = m.coverImage?.large || m.coverImage?.medium || null;

                // Prefer lastEpisode computed from schedules, otherwise fallback to nextAiringEpisode or total episodes
                let lastEpisode = (m.lastEpisode !== undefined && m.lastEpisode !== null) ? String(m.lastEpisode) : null;
                if (!lastEpisode) {
                    if (m.nextAiringEpisode && typeof m.nextAiringEpisode.episode === 'number') {
                        const last = m.nextAiringEpisode.episode - 1;
                        lastEpisode = last > 0 ? String(last) : '0';
                    } else if (m.episodes) {
                        lastEpisode = String(m.episodes);
                    } else {
                        lastEpisode = '0';
                    }
                }

                // Extract studio (artist) and original author from media info
                let studioName = null;
                try {
                    if (m.studios && m.studios.nodes && m.studios.nodes.length) {
                        // prefer first studio
                        studioName = m.studios.nodes[0].name || null;
                    }
                } catch (e) { studioName = null }

                let originalAuthor = null;
                try {
                    if (m.staff && m.staff.edges && m.staff.edges.length) {
                        // search for staff edge with role containing 'original'
                        const match = m.staff.edges.find((e) => (e.role || '').toLowerCase().includes('original'))
                        const candidate = match || m.staff.edges[0]
                        if (candidate && candidate.node && candidate.node.name) {
                            originalAuthor = candidate.node.name.full || null
                        }
                    }
                } catch (e) { originalAuthor = null }

                const mangaInfo = {
                    title: title.trim(),
                    description: m.description || null,
                    type: 'ANIME',
                    demographic: null,
                    published: null,
                    status: m.status || null,
                    artist: studioName,
                    author: originalAuthor,
                    theme: null,
                    publishers: null,
                    tags: []
                };

                if (coverUrl) {
                    const coverFileName = `anilist-${m.id}.jpg`;
                    const coverPath = await downloadCover(coverUrl, coverFileName);
                    if (coverPath) {
                        mangaInfo.coverPath = coverPath;
                        mangaInfo.coverUrl = coverUrl;
                    }
                }

                await saveChapter('anilist', lastEpisode, m.siteUrl || '', m.siteUrl || '', mangaInfo);
            } catch (err) {
                console.warn('⚠️ AniList: erreur traitement média:', err.message || err);
                continue;
            }
        }

        console.log('✅ AniList fetch terminé.');
    } catch (err) {
        console.error('❌ Erreur AniList:', err.message || err);
    }
}

export { anilist };
