// Vérifie que api/utils/seoRoutes.js et frontend/src/seo/config.ts décrivent exactement les mêmes URL (sinon le sitemap publie des 404).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

const here = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_TS = path.resolve(here, '../../frontend/src/seo/config.ts')
const ROUTE_TRANSLATIONS_TS = path.resolve(here, '../../frontend/src/seo/routeTranslations.ts')

const server = await import('../utils/seoRoutes.js')

// Extrait un objet littéral `export const NOM = { ... }` du fichier TypeScript.
function extractObject(source, name) {
    const start = source.indexOf(`export const ${name} = {`)
    if (start === -1) throw new Error(`${name} introuvable`)
    const open = source.indexOf('{', start)
    let depth = 0
    let end = open
    for (let i = open; i < source.length; i++) {
        if (source[i] === '{') depth++
        else if (source[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    const body = source.slice(open, end + 1)
    // Les littéraux ne contiennent que des chaînes et des identifiants de clé : on les rend JSON-compatibles plutôt que d'embarquer un parseur TypeScript.
    const json = body
        .replace(/\/\/[^\n]*/g, '')
        .replace(/'/g, '"')
        .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
        .replace(/,(\s*[}\]])/g, '$1')
    return JSON.parse(json)
}

describe('Parité frontend ↔ api', () => {
    test('frontend/src/seo/config.ts existe', () => assert.ok(fs.existsSync(CONFIG_TS), `${CONFIG_TS} introuvable`))

    const source = fs.readFileSync(CONFIG_TS, 'utf8')
    const translationsSource = fs.readFileSync(ROUTE_TRANSLATIONS_TS, 'utf8')
    const LOCALES = JSON.parse(
        source.match(/export const LOCALES = \[([^\]]+)\]/)[1]
            .replace(/'/g, '"')
            .replace(/,\s*$/, '')
            .replace(/^/, '[')
            .replace(/$/, ']')
    )

    test('LOCALES', () => assert.deepStrictEqual(server.LOCALES, LOCALES))
    test('DEFAULT_LOCALE', () => assert.strictEqual(server.DEFAULT_LOCALE, source.match(/DEFAULT_LOCALE: Locale = '(\w+)'/)[1]))
    test('MEDIA_SEGMENTS', () => assert.deepStrictEqual(server.MEDIA_SEGMENTS, extractObject(translationsSource, 'MEDIA_SEGMENTS')))
    test('PAGE_SEGMENTS', () => assert.deepStrictEqual(server.PAGE_SEGMENTS, extractObject(translationsSource, 'PAGE_SEGMENTS')))

    test('INDEXABLE_PAGES connues du frontend', () => {
        const frontPages = Object.keys(extractObject(translationsSource, 'PAGE_SEGMENTS'))
        const indexableUnknown = server.INDEXABLE_PAGES.map(p => p.key).filter(k => !frontPages.includes(k))
        assert.deepStrictEqual(indexableUnknown, [])
    })

    test('PRIVATE_PAGE_KEYS connues du frontend', () => {
        const frontPages = Object.keys(extractObject(translationsSource, 'PAGE_SEGMENTS'))
        const privateUnknown = server.PRIVATE_PAGE_KEYS.filter(k => !frontPages.includes(k))
        assert.deepStrictEqual(privateUnknown, [])
    })

    // Une page ne peut pas être à la fois listée au sitemap et interdite au crawl.
    test('aucune page à la fois indexable et privée', () => {
        const contradictory = server.INDEXABLE_PAGES
            .map(p => p.key)
            .filter(k => server.PRIVATE_PAGE_KEYS.includes(k))
        assert.deepStrictEqual(contradictory, [])
    })
})
