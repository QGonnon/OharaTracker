import { TRANSLITERATIONS } from './transliterations'

// Conservé tel quel pour résoudre les URL déjà partagées (supprimait tout caractère non-ASCII).
export function slugifyLegacy(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

// Contrairement à slugifyLegacy, les accents sont rabattus (é→e) et les caractères CJK conservés.
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

// La première valeur est la forme canonique, les suivantes ne servent qu'à rediriger vers elle.
export function slugCandidates(title: string): string[] {
  return [...new Set([slugify(title), slugifyLegacy(title)].filter(Boolean))]
}
