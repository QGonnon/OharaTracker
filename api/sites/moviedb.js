import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { saveChapter } from '../utils/index.js';
import { downloadCover } from '../utils/cover.js';

dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Simple in-memory cache
let _cache = {
    ts: 0,
    data: null
};
const TTL = 1000 * 60 * 30; // 30 minutes

async function queryTMDB(endpoint, params = {}) {
    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'en-US',
        ...params
    });

    const res = await fetch(`${TMDB_API_BASE}${endpoint}?${queryParams}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`);
    const json = await res.json();
    if (json.status_code && json.status_code !== 1) throw new Error(json.status_message || 'TMDB error');
    return json;
}

async function fetchPopularAnime() {
    if (Date.now() - _cache.ts < TTL && _cache.data) return _cache.data;

    try {
        const animes = [];
        const seenIds = new Set(); // To avoid duplicates

        // Helper function to fetch and process animes
        const processResults = async (results) => {
            for (const show of results) {
                if (seenIds.has(show.id)) continue;
                seenIds.add(show.id);

                try {
                    // Get detailed info for each show to get more data
                    const details = await queryTMDB(`/tv/${show.id}`, {
                        append_to_response: 'credits,external_ids'
                    });

                    // Double-check it's from Japan
                    const originCountries = details.origin_country || [];
                    if (!originCountries.includes('JP')) {
                        continue;
                    }

                    const anime = {
                        id: show.id,
                        title: show.name || show.original_name || `Anime ${show.id}`,
                        description: show.overview || null,
                        coverImage: {
                            large: show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : null,
                            medium: show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : null
                        },
                        siteUrl: `https://www.themoviedb.org/tv/${show.id}`,
                        episodes: details.number_of_episodes || 0,
                        status: details.status || 'Unknown',
                        genres: details.genres?.map(g => g.name) || [],
                        creators: details.created_by?.map(c => c.name) || [],
                        networks: details.networks?.map(n => n.name) || [],
                        first_air_date: show.first_air_date || null,
                        last_air_date: details.last_air_date || null
                    };

                    animes.push(anime);
                } catch (err) {
                    console.warn('⚠️ TMDB: Erreur traitement série:', err.message || err);
                    continue;
                }
            }
        };

        // Fetch popular animes (multiple pages)
        console.log('📺 Fetching popular anime...');
        for (let page = 1; page <= 3; page++) {
            const popularData = await queryTMDB('/discover/tv', {
                sort_by: 'popularity.desc',
                page: page,
                with_genres: '16', // Animation genre
                with_origin_country: 'JP', // Japanese content only
                without_genres: '',
            });
            await processResults(popularData.results || []);
        }

        // Fetch recently aired animes
        console.log('🎞️ Fetching recently aired anime...');
        const recentlyAiredData = await queryTMDB('/discover/tv', {
            sort_by: 'first_air_date.desc',
            page: 1,
            with_genres: '16', // Animation genre
            with_origin_country: 'JP', // Japanese content only
            without_genres: '',
        });
        await processResults(recentlyAiredData.results || []);

        // Fetch upcoming animes (next 3 months)
        console.log('🎬 Fetching upcoming anime...');
        const today = new Date().toISOString().split('T')[0];
        const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const upcomingData = await queryTMDB('/discover/tv', {
            sort_by: 'first_air_date.desc',
            page: 1,
            with_genres: '16', // Animation genre
            with_origin_country: 'JP', // Japanese content only
            'air_date.gte': today,
            'air_date.lte': threeMonthsLater,
            without_genres: '',
        });
        await processResults(upcomingData.results || []);

        _cache = { ts: Date.now(), data: animes };
        return animes;
    } catch (err) {
        console.error('❌ Erreur TMDB fetch:', err.message || err);
        return [];
    }
}

async function moviedb(page) {
    try {
        if (!TMDB_API_KEY) {
            console.error('❌ TMDB_API_KEY not configured. Please set the environment variable.');
            return;
        }

        console.log('🔍 Fetching TMDB popular anime...');
        const animes = await fetchPopularAnime();

        for (const anime of animes) {
            try {
                const title = anime.title;
                const coverUrl = anime.coverImage.large;

                // Check if anime is coming soon (status is "Planned" or air_date is in the future)
                const isComingSoon = anime.status === 'Planned' || (anime.first_air_date && new Date(anime.first_air_date) > new Date());
                
                // For TV shows, use total episodes or estimate based on last known episode
                let lastEpisode = isComingSoon ? 'Bientôt disponible' : (anime.episodes > 0 ? String(anime.episodes) : '0');

                // Extract creators/studios
                let studioName = null;
                if (anime.networks && anime.networks.length) {
                    studioName = anime.networks[0];
                }

                let originalAuthor = null;
                if (anime.creators && anime.creators.length) {
                    originalAuthor = anime.creators[0];
                }

                const animeInfo = {
                    title: title.trim(),
                    description: anime.description,
                    type: 'ANIME',
                    demographic: null,
                    published: anime.first_air_date || null,
                    status: isComingSoon ? 'Coming Soon' : anime.status,
                    artist: studioName,
                    author: originalAuthor,
                    theme: anime.genres && anime.genres.length ? anime.genres.join(', ') : null,
                    publishers: null,
                    tags: anime.genres || []
                };

                if (coverUrl) {
                    const coverFileName = `moviedb-${anime.id}.jpg`;
                    const coverPath = await downloadCover(coverUrl, coverFileName);
                    if (coverPath) {
                        animeInfo.coverPath = coverPath;
                        animeInfo.coverUrl = coverUrl;
                    }
                }

                await saveChapter('moviedb', lastEpisode, anime.siteUrl, anime.siteUrl, animeInfo);
            } catch (err) {
                console.warn('⚠️ TMDB: Erreur traitement média:', err.message || err);
                continue;
            }
        }

        console.log('✅ TMDB fetch terminé.');
    } catch (err) {
        console.error('❌ Erreur TMDB:', err.message || err);
    }
}

export { moviedb };
