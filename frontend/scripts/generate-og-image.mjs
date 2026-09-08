/**
 * Génère les images de partage Open Graph, une par langue.
 *
 * 1200×630 est le format attendu par la carte `summary_large_image` (X, LinkedIn)
 * et par l'aperçu de Discord, WhatsApp et Facebook. Une image carrée y est
 * recadrée, ce qui coupe le texte — d'où un rendu dédié plutôt que l'icône PWA.
 *
 * Produit `public/og-default-<langue>.png` pour les cinq langues, plus
 * `public/og-default.png` (copie de la langue par défaut) qui sert de repli.
 *
 * Lancer avec `npm run og:image` après toute modification du logo ou des baselines.
 */
import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public')

const LOCALES = ['fr', 'en', 'de', 'it', 'es']
const DEFAULT_LOCALE = 'en'

// Violet de la marque (`theme_color` du manifeste PWA) et sa déclinaison foncée.
const VIOLET = '#7c3aed'
const VIOLET_DARK = '#4c1d95'
const VIOLET_LIGHT = '#a78bfa'

/**
 * Accroche par langue. Trois lignes courtes : au-delà, le texte déborde de la
 * zone de gauche ou passe sous les dos de livres.
 */
const COPY = {
  fr: {
    lines: ['Mangas, manhwas', 'et animés', 'au même endroit.'],
    tagline: 'Bibliothèque unique · Notifications de sortie · Gratuit',
  },
  en: {
    lines: ['Manga, manhwa', 'and anime,', 'all in one place.'],
    tagline: 'One library · Release notifications · Free',
  },
  de: {
    lines: ['Manga, Manhwa', 'und Anime,', 'alles an einem Ort.'],
    tagline: 'Eine Bibliothek · Benachrichtigungen · Kostenlos',
  },
  it: {
    lines: ['Manga, manhwa', 'e anime,', 'tutto in un posto.'],
    tagline: 'Una libreria · Notifiche di uscita · Gratis',
  },
  es: {
    lines: ['Manga, manhwa', 'y anime,', 'todo en un lugar.'],
    tagline: 'Una biblioteca · Avisos de lanzamiento · Gratis',
  },
}

/** Échappe le texte inséré dans le SVG (une apostrophe typographique suffit à le casser). */
const esc = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

/**
 * Taille de police adaptée à la ligne la plus longue.
 * L'allemand et l'espagnol produisent des lignes sensiblement plus longues que
 * l'anglais ; sans cet ajustement le texte sortirait du cadre.
 */
const headlineSize = lines => {
  const longest = Math.max(...lines.map(l => l.length))
  if (longest <= 16) return 70
  if (longest <= 19) return 62
  return 55
}

const buildSvg = locale => {
  const { lines, tagline } = COPY[locale]
  const size = headlineSize(lines)
  const lineHeight = Math.round(size * 1.17)
  const firstBaseline = 330 - (size - 70) // remonte le bloc quand la police grossit

  const headline = lines.map((line, i) => {
    // La dernière ligne porte le dégradé, pour créer un point d'accroche visuel.
    const fill = i === lines.length - 1 ? 'url(#accent)' : '#ffffff'
    return `<text x="90" y="${firstBaseline + i * lineHeight}" font-size="${size}" font-weight="800" fill="${fill}">${esc(line)}</text>`
  }).join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.1" r="0.8">
      <stop offset="0%" stop-color="${VIOLET}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${VIOLET_LIGHT}"/>
      <stop offset="100%" stop-color="${VIOLET}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Trois dos de livres : une bibliothèque, dont un titre déjà rattrapé -->
  <g transform="translate(840 150)">
    <rect x="0"   y="40" width="66" height="300" rx="8" fill="${VIOLET_DARK}" opacity="0.85"/>
    <rect x="82"  y="10" width="66" height="330" rx="8" fill="${VIOLET}" opacity="0.9"/>
    <rect x="164" y="60" width="66" height="280" rx="8" fill="${VIOLET_LIGHT}" opacity="0.85"/>
    <circle cx="197" cy="120" r="17" fill="#09090b"/>
    <path d="M189 120 l6 6 l11 -13" stroke="${VIOLET_LIGHT}" stroke-width="4" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <g font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif">
    <text x="90" y="228" font-size="34" font-weight="600" fill="${VIOLET_LIGHT}"
          letter-spacing="6">OHARA TRACKER</text>
    ${headline}
    <text x="90" y="560" font-size="26" fill="#a1a1aa">${esc(tagline)}</text>
  </g>

  <rect x="0" y="618" width="1200" height="12" fill="url(#accent)"/>
</svg>`
}

for (const locale of LOCALES) {
  const out = path.join(PUBLIC_DIR, `og-default-${locale}.png`)
  await sharp(Buffer.from(buildSvg(locale))).png({ compressionLevel: 9 }).toFile(out)
  const { size } = await fs.stat(out)
  console.log(`✅ og-default-${locale}.png — 1200×630, ${(size / 1024).toFixed(1)} Ko`)
}

// Repli utilisé quand la langue n'est pas connue au moment du rendu.
await fs.copyFile(
  path.join(PUBLIC_DIR, `og-default-${DEFAULT_LOCALE}.png`),
  path.join(PUBLIC_DIR, 'og-default.png')
)
console.log(`✅ og-default.png (copie de ${DEFAULT_LOCALE})`)
