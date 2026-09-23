// Garde-fou anti-régression d'accessibilité (npm run check:a11y) : ne remplace pas un audit complet.
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

const lineOf = (source, index) => source.slice(0, index).split('\n').length

// Neutralise les commentaires HTML (espaces, pas suppression, pour garder les numéros de ligne).
const stripComments = source =>
  source.replace(/<!--[\s\S]*?-->/g, block => block.replace(/[^\n]/g, ' '))

for (const file of walk(SRC)) {
  const source = stripComments(fs.readFileSync(file, 'utf8'))

  // 1. Élément non interactif porteur d'un @click sans équivalent clavier.
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

  // 4. <label> sans `for` : ignoré par les lecteurs d'écran.
  for (const m of source.matchAll(/<label\b(?:(?!>)[\s\S])*>/g)) {
    if (/\bfor=/.test(m[0])) continue
    report(file, lineOf(source, m.index), 'label orphelin', m[0].slice(0, 70).replace(/\s+/g, ' '))
  }

  // 5. Bouton imbriqué dans un lien : HTML invalide, clavier imprévisible.
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

  // 7. Couleurs à contraste connu insuffisant.
  //
  // La nuance 400 passe sur fond sombre et échoue sur fond clair : la règle doit
  // donc distinguer `dark:text-slate-400` (correct) de `text-slate-400` (2,8:1 sur
  // blanc). D'où des expressions plutôt que de simples sous-chaînes, et un
  // signalement de TOUTES les occurrences, pas seulement de la première.
  //
  // Les familles gray et zinc ne sont plus utilisées par le projet, mais restent
  // surveillées : les réintroduire ramènerait le problème sans prévenir.
  const WEAK = [
    { motif: /(?<!dark:)\btext-(?:slate|gray|zinc|neutral)-400\b/g, note: 'sous 4,5:1 sur fond clair, passer en 500 ou 600' },
    { motif: /(?<!dark:)\btext-(?:slate|gray|zinc|neutral)-300\b/g, note: 'sous 4,5:1 sur fond clair, passer en 500 ou 600' },
    { motif: /\bdark:text-(?:slate|gray|zinc|neutral)-(?:500|600)\b/g, note: 'trop sombre sur fond sombre, passer en 300 ou 400' },
    { motif: /\bplaceholder-(?:slate|gray|zinc)-400\b/g, note: 'placeholder illisible, passer en 500' },
    { motif: /\btext-(?:orange|amber|blue)-500\b/g, note: 'sous 4,5:1, passer en 600 ou 700' },
  ]

  for (const { motif, note } of WEAK) {
    for (const m of source.matchAll(motif)) {
      // Un glyphe décoratif (aria-hidden) ne porte aucune information : WCAG 1.4.3
      // ne lui impose pas de contraste. C'est le cas de l'étoile vide d'une note
      // ou du tiret d'une option non incluse, qui doivent justement rester pâles.
      const ligne = source.slice(source.lastIndexOf('\n', m.index) + 1, source.indexOf('\n', m.index))
      if (ligne.includes('aria-hidden')) continue

      report(file, lineOf(source, m.index), 'contraste insuffisant', `${m[0]} : ${note}`)
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
