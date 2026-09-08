/**
 * Garde-fou anti-régression d'accessibilité.
 *
 * Ne remplace pas un audit (Lighthouse, axe, test au lecteur d'écran) : il
 * vérifie seulement que les défauts déjà corrigés ne reviennent pas. Chaque
 * règle correspond à un problème réellement trouvé sur ce projet.
 *
 * Lancer avec `npm run check:a11y`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/components')

const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name)
  if (entry.isDirectory()) return walk(full)
  return entry.name.endsWith('.vue') ? [full] : []
})

const problems = []
const report = (file, line, rule, detail) =>
  problems.push({ file: path.relative(SRC, file), line, rule, detail })

/** Numéro de ligne d'un index de caractère. */
const lineOf = (source, index) => source.slice(0, index).split('\n').length

/**
 * Neutralise les commentaires HTML en préservant les positions.
 * Sans ça, une balise citée dans un commentaire explicatif est signalée comme
 * un vrai défaut. Les caractères sont remplacés par des espaces plutôt que
 * supprimés, pour que les numéros de ligne restent exacts.
 */
const stripComments = source =>
  source.replace(/<!--[\s\S]*?-->/g, block => block.replace(/[^\n]/g, ' '))

for (const file of walk(SRC)) {
  const source = stripComments(fs.readFileSync(file, 'utf8'))

  // 1. Élément non interactif porteur d'un @click sans équivalent clavier.
  //    Rendait la recherche et la bibliothèque inutilisables au clavier.
  for (const m of source.matchAll(/<(div|span|li|img|p)\b[^>]*@click[^>]*>/g)) {
    if (/role=|tabindex=|@keydown|@click.stop/.test(m[0])) continue
    report(file, lineOf(source, m.index), 'clic sans clavier',
      `<${m[1]}> avec @click sans role/tabindex/@keydown`)
  }

  // 2. Image sans attribut alt (alt="" est valide : image décorative).
  for (const m of source.matchAll(/<img\b[^>]*>/g)) {
    if (/\salt=|:alt=/.test(m[0])) continue
    report(file, lineOf(source, m.index), 'image sans alt', m[0].slice(0, 60).replace(/\s+/g, ' '))
  }

  // 3. Bouton PrimeVue à icône seule sans nom accessible.
  for (const m of source.matchAll(/<Button\b[^>]*>/g)) {
    const tag = m[0]
    if (!/\bicon=/.test(tag)) continue
    if (/label=|aria-label=|asChild/.test(tag)) continue
    report(file, lineOf(source, m.index), 'bouton sans nom',
      'Button avec icon= mais ni label= ni aria-label=')
  }

  // 4. <label> sans `for` ni contrôle englobé : ignoré par les lecteurs d'écran.
  for (const m of source.matchAll(/<label\b(?:(?!>)[\s\S])*>/g)) {
    if (/\bfor=/.test(m[0])) continue
    report(file, lineOf(source, m.index), 'label orphelin', m[0].slice(0, 70).replace(/\s+/g, ' '))
  }

  // 5. Bouton ou lien imbriqué dans un lien : HTML invalide, clavier imprévisible.
  for (const m of source.matchAll(/<RouterLink\b(?:(?!<\/RouterLink>)[\s\S])*?<(Button|button)\b/g)) {
    report(file, lineOf(source, m.index), 'bouton dans un lien',
      'utiliser <Button asChild v-slot> autour du RouterLink')
  }

  // 6. Équilibrage et hiérarchie des titres.
  for (let level = 1; level <= 6; level++) {
    const open = (source.match(new RegExp(`<h${level}(?=[\\s/>])`, 'g')) || []).length
    const close = (source.match(new RegExp(`</h${level}>`, 'g')) || []).length
    if (open !== close) {
      report(file, 0, 'titres déséquilibrés', `h${level} : ${open} ouvrant(s) / ${close} fermant(s)`)
    }
  }
  const levels = [...source.matchAll(/<h([1-6])(?=[\s/>])/g)].map(m => Number(m[1]))
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      report(file, 0, 'saut de niveau de titre', `h${levels[i - 1]} → h${levels[i]}`)
    }
  }

  // 7. Couleurs dont le contraste est connu comme insuffisant sur ce projet.
  const WEAK = ['text-gray-400', 'dark:text-zinc-500', 'dark:text-zinc-600',
    'placeholder-slate-400', 'text-orange-500', 'text-amber-500', 'text-blue-500']
  for (const cls of WEAK) {
    const idx = source.indexOf(cls)
    if (idx !== -1) {
      report(file, lineOf(source, idx), 'contraste insuffisant',
        `${cls} est sous 4,5:1 — utiliser la nuance 600/700`)
    }
  }
}

if (problems.length === 0) {
  console.log('✅ aucune régression d’accessibilité détectée')
  process.exit(0)
}

const byRule = problems.reduce((acc, p) => {
  ;(acc[p.rule] ??= []).push(p)
  return acc
}, {})

for (const [rule, items] of Object.entries(byRule)) {
  console.log(`\n── ${rule} (${items.length})`)
  for (const p of items) {
    console.log(`   ${p.file}${p.line ? ':' + p.line : ''}  ${p.detail}`)
  }
}
console.log(`\n❌ ${problems.length} régression(s) potentielle(s)`)
process.exit(1)
