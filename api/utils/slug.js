// Miroir exact de `frontend/src/utils.ts`.
//
// Le slug d'une œuvre est calculé à partir de son titre, jamais stocké en base.
// Il doit donc être produit à l'identique côté client et côté serveur, sinon une
// URL générée par le sitemap ne résoudrait pas dans l'application (et inversement).
// Toute modification ici doit être répercutée dans `frontend/src/utils.ts`.

const TRANSLITERATIONS = {
    'æ': 'ae', 'œ': 'oe', 'ø': 'o', 'đ': 'd', 'ð': 'd', 'þ': 'th', 'ß': 'ss', 'ł': 'l', 'ı': 'i',
    '·': '-', '・': '-', '×': 'x', '＆': 'and', '&': 'and', '@': 'at',
};

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
