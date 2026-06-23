import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import Fuse from 'fuse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveChapter } from '../utils/index.js';
import { downloadCover } from '../utils/cover.js';
import { isLibraryExist } from '../utils/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'json');
const PATH_ANIME = path.join(DATA_DIR, 'AnimeInfo.json');
const URL_PW = 'https://anime-sama.pw';

const HEADERS = {
    'Accept': '*/*',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
};

const VIDEO_HEADERS = {
    ...HEADERS,
    'Origin': 'https://vidmoly.net',
    'Referer': 'https://vidmoly.net/',
};

const ALLOWED_SITES = [
    'video.sibnet.ru', 'sibnet.ru', 'vidmoly.to', 'vidmoly.net',
    'smoothpre.com', 'vidhide.com', 'streamwish.com', 'sendvid.com',
];

// ─── URL Finder ────────────────────────────────────────────────────────────────

async function findBaseUrl() {
    try {
        const res = await fetch(URL_PW, { headers: HEADERS, timeout: 10000 });
        const html = await res.text();

        const match = html.match(/const domains = \[(.*?)\];/s);
        if (!match) return null;

        const domains = [...match[1].matchAll(/name:\s*'([^']+)'/g)].map(m => m[1]);

        for (const domain of domains) {
            try {
                const url = `https://${domain}`;
                const r = await fetch(url, { headers: HEADERS, redirect: 'manual', timeout: 5000 });
                if (r.status === 200) return url;
            } catch (_) { /* skip unreachable domains */ }
        }
    } catch (e) {
        console.error('❌ findBaseUrl error:', e.message);
    }
    return null;
}

// ─── Title Normalisation ───────────────────────────────────────────────────────

function normalizeTitle(title) {
    if (!title) return '';
    title = title.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    title = title.replace(/[""]/g, '"').replace(/['']/g, "'");
    title = title.replace(/[\/\\\:*?"<>|]/g, ' ');
    title = title.replace(/[^a-zA-Z0-9\-_&.'#\s]/g, ' ');
    return title.replace(/\s+/g, ' ').trim();
}

function cleanString(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// ─── Catalogue Scraper ─────────────────────────────────────────────────────────

async function getAllAnime(reset = false) {
    fs.mkdirSync(DATA_DIR, { recursive: true });

    if (fs.existsSync(PATH_ANIME) && !reset) {
        return 'Fichier déjà existant, passez reset=true pour actualiser';
    }

    const baseUrl = await findBaseUrl();
    if (!baseUrl) return 'Impossible de trouver le domaine anime-sama actif';

    const data = [];
    let page = 1;

    while (true) {
        try {
            const res = await fetch(`${baseUrl}/catalogue/?page=${page}`, { headers: HEADERS });
            if (res.status !== 200) return res.status;

            const html = await res.text();
            const $ = cheerio.load(html);

            const endPage = $('p.text-white.font-bold.text-2xl.h-96.p-5');
            if (endPage.length > 0) {
                fs.writeFileSync(PATH_ANIME, JSON.stringify(data, null, 2), 'utf-8');
                return 'Récupération achevée';
            }

            const cards = $('div.shrink-0.catalog-card.card-base');
            cards.each((_, card) => {
                const titre = $(card).find('h2.card-title').text().trim() || 'Titre introuvable';
                const link = $(card).find('a').attr('href') || '';
                data.push({ title: normalizeTitle(titre), link });
            });

            page++;
        } catch (e) {
            console.error(`❌ getAllAnime page ${page}:`, e.message);
            break;
        }
    }

    return data;
}

// ─── Load Cached Data ──────────────────────────────────────────────────────────

async function loadBaseAnimeData() {
    if (!fs.existsSync(PATH_ANIME)) {
        return 'Fichier non existant, appelez /api/getAllAnime d\'abord';
    }

    const animeData = JSON.parse(fs.readFileSync(PATH_ANIME, 'utf-8'));

    const baseUrl = await findBaseUrl();
    if (baseUrl) {
        const baseDomain = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const needsRefresh = animeData.some(a => a.link && !a.link.includes(baseDomain));
        if (needsRefresh) {
            await getAllAnime(true);
            return JSON.parse(fs.readFileSync(PATH_ANIME, 'utf-8'));
        }
    }

    return animeData;
}

// ─── Fuzzy Search ──────────────────────────────────────────────────────────────

async function searchAnime(search, limit = 5) {
    const animesData = await loadBaseAnimeData();
    if (!Array.isArray(animesData)) return [];

    const cleanedSearch = cleanString(search);
    if (!cleanedSearch) return [];

    const entries = animesData
        .filter(a => a.title)
        .map(a => ({ ...a, cleanTitle: cleanString(a.title) }));

    const fuse = new Fuse(entries, {
        keys: ['cleanTitle'],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true,
    });

    const results = fuse.search(cleanedSearch, { limit: 15 });

    const seen = new Set();
    const final = [];

    for (const r of results) {
        if (final.length >= limit) break;
        const item = r.item;
        if (seen.has(item.link)) continue;
        seen.add(item.link);

        const lengthRatio = item.cleanTitle.length / cleanedSearch.length;
        let bonus = 0;
        if (lengthRatio >= 0.9 && lengthRatio <= 1.1) bonus = 10;
        else if (lengthRatio < 0.5) bonus = -15;

        const score = Math.round((1 - r.score) * 100) + bonus;
        final.push({ title: item.title, lien: item.link, score });
    }

    return final.sort((a, b) => b.score - a.score);
}

// ─── Anime Info (Seasons) ──────────────────────────────────────────────────────

async function getInfoAnime(query) {
    const results = await searchAnime(query, 1);
    if (!results.length) return [];

    const { lien: baseUrl, title } = results[0];
    const animes = [];

    try {
        const res = await fetch(baseUrl, { headers: HEADERS });
        const html = await res.text();

        const pattern = /panneau(?:Anime|Film|Scan|Visual)\s*\(\s*(["'])(.*?)\1\s*,\s*(["'])(.*?)\3\s*\)/g;
        let m;
        while ((m = pattern.exec(html)) !== null) {
            const nom = m[2];
            const lien = m[4];
            if (nom.toLowerCase() !== 'nom' && lien.toLowerCase() !== 'url') {
                const saison_url = baseUrl.replace(/\/$/, '') + '/' + lien.replace(/^\//, '');
                animes.push({ base_url: baseUrl, title, Saison: nom, url: saison_url });
            }
        }
    } catch (e) {
        console.error('❌ getInfoAnime:', e.message);
    }

    return animes;
}

// ─── Specific Season ──────────────────────────────────────────────────────────

async function getSpecificAnime(nom, saison = 'saison1', version = 'vostfr') {
    if (!saison) saison = 'saison1';
    if (!version) version = 'vostfr';

    const reponse = await getInfoAnime(nom);
    const saisonNorm = saison.trim().toLowerCase().replace(/\s/g, '');

    return reponse.find(item =>
        item.Saison && item.Saison.trim().toLowerCase().replace(/\s/g, '') === saisonNorm
    ) || null;
}

// ─── Video URL Resolvers ───────────────────────────────────────────────────────

function toBaseN(num, base) {
    if (num === 0) return '0';
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let res = '';
    while (num > 0) { res = chars[num % base] + res; num = Math.floor(num / base); }
    return res;
}

function decodePack(p, a, c, kStr) {
    const kList = kStr.split('|');
    for (let i = c - 1; i >= 0; i--) {
        if (i < kList.length && kList[i]) {
            const alias = toBaseN(i, a);
            p = p.replace(new RegExp('\\b' + alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g'), kList[i]);
        }
    }
    return p;
}

async function resolveVidmoly(url) {
    const urlNet = url.replace('vidmoly.to', 'vidmoly.net');
    try {
        const r = await fetch(urlNet, { headers: { ...VIDEO_HEADERS, Referer: urlNet }, timeout: 10000 });
        let text = await r.text();

        const redirect = text.match(/window\.location\.replace\('([^']+)'\)/);
        if (redirect) {
            const r2 = await fetch(redirect[1], { headers: { ...VIDEO_HEADERS, Referer: urlNet }, timeout: 10000 });
            text = await r2.text();
        }

        const m = text.match(/file\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/);
        if (m) return { url: m[1], type: 'm3u8' };
    } catch (_) { /* unreachable */ }
    return null;
}

async function resolveSmoothpre(url) {
    const parsed = new URL(url);
    const base = `${parsed.protocol}//${parsed.host}`;
    try {
        const r = await fetch(url, { headers: { ...HEADERS, Referer: base + '/' }, timeout: 10000 });
        const text = await r.text();

        const evalMatch = text.match(/eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)\)\)/s);
        if (evalMatch) {
            const decoded = decodePack(evalMatch[1], parseInt(evalMatch[2]), parseInt(evalMatch[3]), evalMatch[4]);
            for (const key of ['hls4', 'hls3', 'hls2']) {
                const m = decoded.match(new RegExp(`"${key}"\\s*:\\s*"(.*?)"`));
                if (m) {
                    let target = m[1].replace(/\\/g, '');
                    if (target.startsWith('/')) target = base + target;
                    return { url: target, type: 'm3u8' };
                }
            }
        }
    } catch (_) { /* unreachable */ }
    return null;
}

async function resolveSendvid(url) {
    try {
        const r = await fetch(url, { headers: { ...HEADERS, Referer: 'https://sendvid.com/' }, timeout: 10000 });
        const text = await r.text();

        let m = text.match(/<source\s+src="([^"]+\.mp4[^"]*)"/);
        if (!m) m = text.match(/property="og:video"\s+content="([^"]+)"/);
        if (!m) m = text.match(/property="og:video:url"\s+content="([^"]+)"/);
        if (m) {
            let videoUrl = m[1];
            if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl;
            return { url: videoUrl, type: 'mp4' };
        }
    } catch (_) { /* unreachable */ }
    return null;
}

const RESOLVER_MAP = {
    'vidmoly.to': resolveVidmoly,
    'vidmoly.net': resolveVidmoly,
    'smoothpre.com': resolveSmoothpre,
    'vidhide.com': resolveSmoothpre,
    'streamwish.com': resolveSmoothpre,
    'sendvid.com': resolveSendvid,
};

function hasEmptyQueryParams(url) {
    try {
        const parsed = new URL(url);
        for (const value of parsed.searchParams.values()) {
            if (value === '') return true;
        }
    } catch (_) { /* ignore */ }
    return false;
}

async function resolveVideoUrl(url) {
    try {
        const domain = new URL(url).hostname.replace(/^www\./, '');
        const resolver = RESOLVER_MAP[domain];
        if (resolver) return await resolver(url);
    } catch (_) { /* bad url */ }
    return { url, type: 'raw' };
}

function parseSeasonNumber(seasonName) {
    if (!seasonName) return 0;
    const match = seasonName.match(/\d+/);
    if (match) return Number(match[0]);
    return /film/i.test(seasonName) ? 0 : 0;
}

async function getAllSeasonEpisodes(title, version = 'vostfr') {
    const seasons = await getInfoAnime(title);
    if (!Array.isArray(seasons) || seasons.length === 0) return [];

    const allEpisodes = [];
    for (const season of seasons) {
        const seasonNumber = parseSeasonNumber(season.Saison);
        const links = await getAnimeLink(title, season.Saison, version);
        for (const item of links) {
            allEpisodes.push({ seasonNumber, episode: item.episode, url: item.url });
        }
    }

    return allEpisodes.sort((a, b) => a.seasonNumber - b.seasonNumber || a.episode - b.episode);
}

async function getAnimeLink(nom, saison = 'saison1', version = 'vostfr') {
    if (!saison) saison = 'saison1';
    if (!version) version = 'vostfr';

    const reponse = await getSpecificAnime(nom, saison, version);
    if (!reponse) return [];

    const baseUrl = reponse.base_url;
    const saisonNum = saison.toLowerCase().replace(/\s/g, '');
    const ver = version.toLowerCase().replace(/\s/g, '');

    let link;
    if (saisonNum === 'film') {
        const url = reponse.url;
        const reworked = url.toLowerCase().replace('//film', '/film').split('/vostfr')[0];
        link = `${reworked}/${ver}`;
    } else {
        link = `${reponse.url.split('/vostfr')[0]}/${ver}`;
    }

    let html;
    try {
        const res = await fetch(link, { headers: HEADERS });
        html = await res.text();
    } catch (e) {
        console.error('❌ getAnimeLink fetch:', e.message);
        return [];
    }

    const scriptTagMatch = html.match(/src='([^"]*episodes\.js[^"]*)'/);
    if (!scriptTagMatch) return [];

    const jsLink = `${link}/${scriptTagMatch[1]}`;

    let jsText;
    try {
        const r = await fetch(jsLink, { headers: HEADERS });
        jsText = await r.text();
    } catch (e) {
        console.error('❌ getAnimeLink episodes.js:', e.message);
        return [];
    }

    const allEps = {};
    for (const [, name, content] of jsText.matchAll(/var\s+(eps\d+)\s*=\s*\[(.*?)\];/gs)) {
        allEps[name] = [...content.matchAll(/'(https?:\/\/[^']+)'/g)].map(m => m[1]);
    }

    const nombreLecteurs = Object.keys(allEps).filter(k => k.startsWith('eps')).length;
    const nombreEpisodes = (allEps['eps1'] || []).length;
    if (nombreEpisodes === 0) return [];

    const goodLinks = [];
    const errors = [];

    for (let ep = 0; ep < nombreEpisodes; ep++) {
        const url = (allEps['eps1'] || [])[ep];
        if (!url) { errors.push({ lecteur: 'eps1', episode: ep, url: '' }); continue; }

        const allowed = ALLOWED_SITES.some(s => url.includes(s));
        if (allowed && !hasEmptyQueryParams(url)) {
            const resolved = await resolveVideoUrl(url);
            if (resolved?.url) {
                goodLinks.push({ episode: ep, url: resolved.url });
                if (goodLinks.length === nombreEpisodes) return goodLinks;
                continue;
            }
        }
        errors.push({ lecteur: 'eps1', episode: ep, url });
    }

    if (errors.length > 0) {
        for (let n = 1; n <= nombreLecteurs; n++) {
            const lecteur = `eps${n}`;
            for (const e of [...errors]) {
                const url = (allEps[lecteur] || [])[e.episode];
                if (!url) continue;

                const allowed = ALLOWED_SITES.some(s => url.includes(s));
                if (!allowed || hasEmptyQueryParams(url)) continue;

                const resolved = await resolveVideoUrl(url);
                if (resolved?.url) {
                    goodLinks.push({ episode: e.episode, url: resolved.url });
                    errors.splice(errors.indexOf(e), 1);
                    if (goodLinks.length === nombreEpisodes) {
                        return goodLinks.sort((a, b) => a.episode - b.episode);
                    }
                }
            }
        }
    }

    return goodLinks.sort((a, b) => a.episode - b.episode);
}

// ─── AniList Cover Search ──────────────────────────────────────────────────────

async function searchAniListCover(title) {
    if (!title) return null;
    try {
        const query = `query ($search: String) {
            Media(search: $search, type: ANIME) {
                coverImage { large medium }
            }
        }`;
        const res = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables: { search: title } }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (json.errors || !json.data?.Media) return null;
        return json.data.Media.coverImage?.large || json.data.Media.coverImage?.medium || null;
    } catch (_) {
        return null;
    }
}

// ─── Main Scraper ──────────────────────────────────────────────────────────────

async function anime_sama() {
    try {
        console.log('🔍 Chargement du catalogue anime-sama...');
        let animeList = await loadBaseAnimeData();

        if (!Array.isArray(animeList)) {
            console.log('📥 Catalogue absent, récupération initiale en cours...');
            await getAllAnime(false);
            animeList = await loadBaseAnimeData();
        }
        animeList = animeList.slice(0, 20);
        
        if (!Array.isArray(animeList)) {
            console.warn('⚠️ anime-sama: impossible de charger le catalogue');
            return;
        }

        for (const anime of animeList) {
            try {
                const animeInfo = {
                    title: anime.title,
                    description: null,
                    type: 'ANIME',
                    demographic: null,
                    published: null,
                    status: null,
                    artist: null,
                    author: null,
                    theme: null,
                    publishers: null,
                    tags: [],
                };
                
                const coverUrl = await searchAniListCover(anime.title);
                const isExist = await isLibraryExist(anime.title);
                if (coverUrl && !isExist) {
                    const coverFileName = `anime-sama-${anime.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                    const coverPath = await downloadCover(coverUrl, coverFileName);
                    if (coverPath) {
                        animeInfo.coverPath = coverPath;
                        animeInfo.coverUrl = coverUrl;
                    }
                }

                const episodeLinks = await getAllSeasonEpisodes(anime.title);
                for (const ep of episodeLinks) {
                    await saveChapter('anime-sama', `${ep.seasonNumber}.${ep.episode + 1}`, ep.url, anime.link, animeInfo);
                }
                // const lastEpisode = episodeLinks.length > 0 ? episodeLinks[episodeLinks.length - 1] : null;
                // const lastChapter = lastEpisode ? `${lastEpisode.seasonNumber}.${lastEpisode.episode}` : '0.0';
                // const chapterUrl = lastEpisode ? lastEpisode.url : anime.link;
                
                //await saveChapter('anime-sama', lastChapter, chapterUrl, anime.link, animeInfo);

                
            } catch (e) {
                console.warn(`⚠️ Erreur avec ${anime.title}:`, e.message);
                continue;
            }
        }

        console.log('✅ Scraping anime-sama terminé.');
    } catch (error) {
        console.error(`❌ Erreur lors du scraping d'anime-sama:`, error);
    }
}

export {
    anime_sama
};
