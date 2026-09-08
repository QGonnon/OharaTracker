/**
 * Génère les versions allégées des captures d'écran de l'accueil.
 *
 * Les originales font 1076-1261 px de large alors qu'elles sont affichées entre
 * 175 et 350 px : Lighthouse mesurait 387 Ko téléchargés pour rien. On les
 * réduit à 760 px, ce qui couvre encore le plus grand affichage (350 px) en
 * densité 2x sur écran Retina.
 *
 * Les fichiers originaux sont conservés comme sources : ce script produit des
 * `*-preview.webp` à côté, référencés par `Home.ts`.
 *
 * Lancer avec `npm run optimize:screenshots` après tout remplacement de capture.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/assets/screenshots')

/** Largeur maximale rendue (350 px) × 2 pour les écrans à haute densité. */
const MAX_WIDTH = 760

const SOURCES = ['library', 'discovery', 'tracking', 'profile']

let before = 0
let after = 0

for (const name of SOURCES) {
  const input = path.join(DIR, `${name}.webp`)
  const output = path.join(DIR, `${name}-preview.webp`)

  const original = await fs.stat(input)
  before += original.size

  await sharp(input)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    // `effort: 6` : compression plus lente mais nettement plus dense, sans
    // conséquence puisque c'est produit une seule fois à la main.
    .webp({ quality: 78, effort: 6 })
    .toFile(output)

  const optimized = await fs.stat(output)
  after += optimized.size

  const meta = await sharp(output).metadata()
  console.log(
    `${name.padEnd(10)} ${(original.size / 1024).toFixed(0).padStart(4)} Ko → ` +
    `${(optimized.size / 1024).toFixed(0).padStart(3)} Ko  (${meta.width}×${meta.height})`
  )
}

console.log(
  `\nTotal : ${(before / 1024).toFixed(0)} Ko → ${(after / 1024).toFixed(0)} Ko ` +
  `(${(100 - (after / before) * 100).toFixed(0)} % de moins)`
)
