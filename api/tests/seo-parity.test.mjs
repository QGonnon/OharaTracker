/**
 * Vérifie que `api/utils/seoRoutes.js` et `frontend/src/seo/config.ts` décrivent
 * exactement les mêmes URL.
 *
 * Les deux fichiers sont volontairement séparés (l'un est du JS Node, l'autre du
 * TypeScript compilé par Vite), mais s'ils divergent le sitemap publie des URL
 * que le router du frontend ne sait pas résoudre — donc des 404 servies à Google
 * sur des pages annoncées comme valides. Ce test rend cette divergence impossible
 * à faire passer inaperçue.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_TS = path.resolve(here, '../../frontend/src/seo/config.ts')

const server = await import('../utils/seoRoutes.js')

let failures = 0
const check = (label, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected)
    if (!ok) failures++
    console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label}`)
    if (!ok) console.log(`        frontend : ${JSON.stringify(expected)}\n        api      : ${JSON.stringify(actual)}`)
}

if (!fs.existsSync(CONFIG_TS)) {
    console.error(`❌ ${CONFIG_TS} introuvable — impossible de vérifier la parité.`)
    process.exit(1)
}
const source = fs.readFileSync(CONFIG_TS, 'utf8')

/** Extrait un objet littéral `export const NOM = { ... }` du fichier TypeScript. */
function extractObject(name) {
    const start = source.indexOf(`export const ${name} = {`)
    if (start === -1) throw new Error(`${name} introuvable dans config.ts`)
    const open = source.indexOf('{', start)
    let depth = 0
    let end = open
    for (let i = open; i < source.length; i++) {
        if (source[i] === '{') depth++
        else if (source[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    const body = source.slice(open, end + 1)
    // Les littéraux ne contiennent que des chaînes et des identifiants de clé :
    // on les rend JSON-compatibles plutôt que d'embarquer un parseur TypeScript.
    const json = body
        .replace(/\/\/[^\n]*/g, '')
        .replace(/'/g, '"')
        .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
        .replace(/,(\s*[}\]])/g, '$1')
    return JSON.parse(json)
}

const LOCALES = JSON.parse(
    source.match(/export const LOCALES = \[([^\]]+)\]/)[1]
        .replace(/'/g, '"')
        .replace(/,\s*$/, '')
        .replace(/^/, '[')
        .replace(/$/, ']')
)

console.log('=== Parité frontend ↔ api ===')
check('LOCALES', server.LOCALES, LOCALES)
check('DEFAULT_LOCALE', server.DEFAULT_LOCALE, source.match(/DEFAULT_LOCALE: Locale = '(\w+)'/)[1])
check('MEDIA_SEGMENTS', server.MEDIA_SEGMENTS, extractObject('MEDIA_SEGMENTS'))
check('PAGE_SEGMENTS', server.PAGE_SEGMENTS, extractObject('PAGE_SEGMENTS'))

// Toutes les pages listées comme indexables doivent exister des deux côtés.
const frontPages = Object.keys(extractObject('PAGE_SEGMENTS'))
const indexableUnknown = server.INDEXABLE_PAGES.map(p => p.key).filter(k => !frontPages.includes(k))
check('INDEXABLE_PAGES connues du frontend', indexableUnknown, [])

const privateUnknown = server.PRIVATE_PAGE_KEYS.filter(k => !frontPages.includes(k))
check('PRIVATE_PAGE_KEYS connues du frontend', privateUnknown, [])

// Une page ne peut pas être à la fois listée au sitemap et interdite au crawl.
const contradictory = server.INDEXABLE_PAGES
    .map(p => p.key)
    .filter(k => server.PRIVATE_PAGE_KEYS.includes(k))
check('aucune page à la fois indexable et privée', contradictory, [])

console.log(`\n${failures === 0 ? '✅ configurations alignées' : `❌ ${failures} divergence(s)`}`)
process.exit(failures === 0 ? 0 : 1)
