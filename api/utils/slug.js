// Miroir exact de `frontend/src/utils.ts` — le slug doit être identique côté client et serveur.
import { TRANSLITERATIONS } from './transliterations.js';

/** Ancien slug : supprimait tout caractère non-ASCII. Conservé pour résoudre les URL déjà partagées. */
export function slugifyLegacy(text) {
    return String(text ?? '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

/** Slug canonique : accents rabattus sur la lettre de base, CJK conservé. */
export function slugify(text) {
    return String(text ?? '')
        .toLowerCase()
        .trim()
        .replace(/[æœøđðþßłı·・×＆&@]/g, ch => TRANSLITERATIONS[ch] ?? ch)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .normalize('NFC')
        .replace(/['’‘`"“”]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Formes acceptées pour résoudre une URL : la canonique d'abord, puis l'ancienne. */
export function slugCandidates(title) {
    return [...new Set([slugify(title), slugifyLegacy(title)].filter(Boolean))];
}

/**
 * Nature d'œuvre normalisée à partir du champ `type` en base.
 * Miroir de `MangaService.resolveMediaKind` côté frontend.
 */
export function resolveMediaKind(dbType) {
    const t = String(dbType ?? '').toLowerCase();
    if (t === 'lecture' || t === 'manga') return 'lecture';
    if (t === 'serie' || t === 'anime') return 'serie';
    if (t === 'film') return 'film';
    return 'lecture';
}
