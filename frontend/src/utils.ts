// Translittérations que `NFD` ne sait pas décomposer : ces lettres ne sont pas
// une base + un diacritique, elles disparaîtraient donc entièrement du slug.
const TRANSLITERATIONS: Record<string, string> = {
  æ: 'ae', œ: 'oe', ø: 'o', đ: 'd', ð: 'd', þ: 'th', ß: 'ss', ł: 'l', ı: 'i',
  '·': '-', '・': '-', '×': 'x', '＆': 'and', '&': 'and', '@': 'at',
}

/**
 * Ancien slug, conservé tel quel pour continuer à résoudre les URL déjà
 * partagées : il supprimait purement et simplement tout caractère non-ASCII,
 * donc `Ōkami` donnait `kami` et un titre japonais une chaîne vide.
 */
export function slugifyLegacy(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

/**
 * Slug canonique utilisé dans les URL indexées.
 *
 * Contrairement à `slugifyLegacy`, les accents sont rabattus sur leur lettre de
 * base (`é` → `e`) au lieu d'être supprimés, et les caractères CJK sont conservés :
 * Google indexe très bien les URL en UTF-8, et un titre entièrement japonais ou
 * coréen produisait auparavant un slug vide — donc une page inaccessible.
 */
export function slugify(text: string) {
  return (text ?? '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[æœøđðþßłı·・×＆&@]/g, ch => TRANSLITERATIONS[ch] ?? ch)
    // décompose `é` en `e` + accent, puis retire les accents (bloc Combining Diacritical Marks)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    // apostrophes et guillemets : collés, pour que `L'Attaque` reste `lattaque`
    .replace(/['’‘`"“”]/g, '')
    // tout le reste (espaces, ponctuation, symboles) devient un séparateur, mais on
    // garde les lettres/chiffres de n'importe quel alphabet, CJK compris
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Toutes les formes de slug sous lesquelles une œuvre peut être demandée.
 * Sert à résoudre une URL : la première valeur est la forme canonique, les
 * suivantes ne sont acceptées que pour rediriger vers elle.
 */
export function slugCandidates(title: string): string[] {
  return [...new Set([slugify(title), slugifyLegacy(title)].filter(Boolean))]
}
