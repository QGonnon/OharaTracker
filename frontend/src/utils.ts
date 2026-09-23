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

// Barème des notes personnelles. Doit rester aligné sur api/utils/score.js :
// le serveur refuse toute note qui n'est pas un multiple de SCORE_STEP entre 0 et SCORE_MAX.
export const SCORE_MAX = 5
export const SCORE_STEP = 0.5

/** Seuil de votes en dessous duquel l'API ne publie pas de moyenne communautaire. */
export const MIN_RATINGS_FOR_AVERAGE = 10

/** Arrondit au demi-point le plus proche, borné au barème. */
export function roundScoreToStep(value: number): number {
  const clamped = Math.min(Math.max(value, 0), SCORE_MAX)
  return Math.round(clamped / SCORE_STEP) * SCORE_STEP
}

/** « 4 », « 3,5 », sans décimale inutile, dans la langue de l'interface. */
export function formatScore(value: number | string | null | undefined, locale = 'fr'): string {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}
