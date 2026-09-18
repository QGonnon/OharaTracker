// Tests SEO : résolution d'une URL vers la bonne page/langue, et contenu exact du <head> rendu côté serveur.
import http from 'node:http'
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

process.env.SITE_URL = 'https://oharatracker.com'
process.env.NODE_ENV = 'production'

const {
    resolvePath, renderHead, negotiateLocale, t, translationsAvailable,
    homePath, pagePath, mediaPath,
} = await import('../seo/head.js')
const { default: seoRoutes } = await import('../routes/seo.js')
const { slugify, slugifyLegacy, resolveMediaKind } = await import('../utils/slug.js')

describe('Slugs', () => {
    test('titre simple', () => assert.strictEqual(slugify('One Piece'), 'one-piece'))
    test('accents rabattus, pas supprimés', () => assert.strictEqual(slugify('Ōkami to Kōshinryō'), 'okami-to-koshinryo'))
    test('CJK conservé', () => assert.strictEqual(slugify('進撃の巨人'), '進撃の巨人'))
    test('apostrophe collée', () => assert.strictEqual(slugify("L'Attaque des Titans"), 'lattaque-des-titans'))
    test('slash en séparateur', () => assert.strictEqual(slugify('Fate/stay night'), 'fate-stay-night'))
    test('esperluette translittérée', () => assert.strictEqual(slugify('Café & Cie'), 'cafe-and-cie'))
    test('ancien slug perdait les accents', () => assert.strictEqual(slugifyLegacy('Ōkami'), 'kami'))
    test('ancien slug vidait le CJK', () => assert.strictEqual(slugifyLegacy('進撃の巨人'), ''))
    test('type BDD anime → serie', () => assert.strictEqual(resolveMediaKind('Anime'), 'serie'))
    test('type BDD manga → lecture', () => assert.strictEqual(resolveMediaKind('Manga'), 'lecture'))
    test('type inconnu → lecture', () => assert.strictEqual(resolveMediaKind(null), 'lecture'))
})

describe('Traductions', () => {
    test('fichiers de locale trouvés', () => assert.strictEqual(translationsAvailable(), true))
    test('titre DE tarifs', () => assert.strictEqual(t('de', 'seo.pricing.title'), 'Preise — Gratis, Perso und Pro'))
    test('interpolation ES', () => assert.strictEqual(
        t('es', 'seo.media.serie.title', { title: 'One Piece' }),
        'One Piece: episodios, temporadas y seguimiento'))
    test('clé absente → chaîne vide', () => assert.strictEqual(t('fr', 'seo.inexistant.title'), ''))
})

describe('Résolution des URL', () => {
    test('racine', () => assert.deepStrictEqual(resolvePath('/'), { kind: 'home', locale: 'en', localeInPath: false }))
    test('accueil FR', () => assert.deepStrictEqual(resolvePath('/fr'), { kind: 'home', locale: 'fr', localeInPath: true }))
    test('/home hérité', () => assert.deepStrictEqual(resolvePath('/home'), { kind: 'home', locale: 'en', localeInPath: false }))
    test('page FR', () => assert.deepStrictEqual(resolvePath('/fr/tarifs'),
        { kind: 'page', locale: 'fr', localeInPath: true, pageKey: 'pricing' }))
    test('page DE', () => assert.deepStrictEqual(resolvePath('/de/preise'),
        { kind: 'page', locale: 'de', localeInPath: true, pageKey: 'pricing' }))
    test('/pricing hérité', () => assert.deepStrictEqual(resolvePath('/pricing'),
        { kind: 'page', locale: 'en', localeInPath: false, pageKey: 'pricing' }))
    test('œuvre FR', () => assert.deepStrictEqual(resolvePath('/fr/manga/one-piece'),
        { kind: 'media', locale: 'fr', localeInPath: true, mediaKind: 'lecture', slug: 'one-piece' }))
    test('œuvre ES (pelicula)', () => assert.deepStrictEqual(resolvePath('/es/pelicula/akira'),
        { kind: 'media', locale: 'es', localeInPath: true, mediaKind: 'film', slug: 'akira' }))
    test('/anime/x hérité', () => assert.deepStrictEqual(resolvePath('/anime/naruto'),
        { kind: 'media', locale: 'en', localeInPath: false, mediaKind: 'serie', slug: 'naruto' }))
    test('URL inconnue → unknown', () => assert.deepStrictEqual(resolvePath('/fr/nimportequoi'),
        { kind: 'unknown', locale: 'fr', localeInPath: true }))
    test('slug encodé décodé', () => assert.strictEqual(resolvePath(`/fr/manga/${encodeURIComponent('進撃の巨人')}`).slug, '進撃の巨人'))
})

describe('Négociation de langue', () => {
    test('de-DE prioritaire', () => assert.strictEqual(negotiateLocale('de-DE,de;q=0.9,en;q=0.8'), 'de'))
    test('langue non couverte → défaut', () => assert.strictEqual(negotiateLocale('ja-JP,ja;q=0.9'), 'en'))
    test('q-values respectées', () => assert.strictEqual(negotiateLocale('pt;q=0.9,it;q=0.8'), 'it'))
})

describe('Construction des chemins', () => {
    test('homePath fr', () => assert.strictEqual(homePath('fr'), '/fr'))
    test('pagePath de/privacy', () => assert.strictEqual(pagePath('privacy', 'de'), '/de/datenschutz'))
    test('mediaPath it/film', () => assert.strictEqual(mediaPath('film', 'akira', 'it'), '/it/film/akira'))
    test('mediaPath encode les espaces', () => assert.strictEqual(mediaPath('lecture', 'a b', 'fr'), '/fr/manga/a%20b'))
})

describe('Rendu du <head>', () => {
    const head = renderHead({
        locale: 'fr',
        pathFor: l => mediaPath('lecture', 'one-piece', l),
        title: 'One Piece : chapitres',
        description: 'Suivez One Piece',
        image: 'https://oharatracker.com/cdn/x.jpg',
        jsonLd: [{ '@type': 'ComicSeries', name: 'One Piece' }],
    })

    test('titre suffixé du nom du site', () =>
        assert.ok(head.includes('<title>One Piece : chapitres | Ohara Tracker</title>')))
    test('canonical dans la langue courante', () =>
        assert.ok(head.includes('<link rel="canonical" href="https://oharatracker.com/fr/manga/one-piece">')))
    test('hreflang es', () => assert.ok(head.includes('hreflang="es" href="https://oharatracker.com/es/manga/one-piece"')))
    test('x-default sur en', () => assert.ok(head.includes('hreflang="x-default" href="https://oharatracker.com/en/manga/one-piece"')))
    test('5 langues + x-default', () => assert.strictEqual((head.match(/rel="alternate"/g) || []).length, 6))
    test('og:image', () => assert.ok(head.includes('content="https://oharatracker.com/cdn/x.jpg"')))
    test('grande vignette autorisée', () => assert.ok(head.includes('max-image-preview:large')))
    test('JSON-LD injecté', () => assert.ok(head.includes('"@type":"ComicSeries"')))

    test('noindex : aucun hreflang, noindex nofollow', () => {
        const noindexHead = renderHead({ locale: 'fr', pathFor: homePath, title: 'Profil', description: 'x', noindex: true })
        assert.ok(!noindexHead.includes('rel="alternate"'))
        assert.ok(noindexHead.includes('content="noindex, nofollow"'))
    })
})

describe('Échappement', () => {
    const escaped = renderHead({
        locale: 'fr', pathFor: homePath,
        title: 'Fate/stay "night" & <Cie>',
        description: 'a "b" & <c>',
    })

    test('title échappé', () => assert.ok(escaped.includes('Fate/stay &quot;night&quot; &amp; &lt;Cie&gt;')))
    test('description échappée', () => assert.ok(escaped.includes('content="a &quot;b&quot; &amp; &lt;c&gt;"')))
    test('JSON-LD : < échappé', () => assert.ok(!renderHead({
        locale: 'fr', pathFor: homePath, title: 'x', description: 'x',
        jsonLd: [{ name: '</script><script>alert(1)</script>' }],
    }).includes('</script><script>alert(1)')))
})

describe('robots.txt et sitemap des pages', () => {
    let server, port

    before(async () => {
        const app = express()
        app.use('/', seoRoutes)
        server = http.createServer(app)
        await new Promise(resolve => server.listen(0, resolve))
        port = server.address().port
    })

    after(() => server.close())

    const get = path => new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port, path }, res => {
            let body = ''
            res.on('data', chunk => (body += chunk))
            res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body }))
        }).on('error', reject)
    })

    test('robots.txt', async () => {
        const robots = await get('/robots.txt')
        assert.strictEqual(robots.status, 200)
        assert.ok(robots.type?.startsWith('text/plain'))
        assert.ok(robots.body.includes('Allow: /'))
        assert.ok(robots.body.includes('Disallow: /fr/profil'))
        assert.ok(robots.body.includes('Disallow: /es/iniciar-sesion'))
        assert.ok(robots.body.includes('Sitemap: https://oharatracker.com/sitemap.xml'))
        assert.ok(!robots.body.includes('Disallow: /fr/tarifs'))
    })

    test('sitemap-pages.xml', async () => {
        const pages = await get('/sitemap-pages.xml')
        assert.strictEqual(pages.status, 200)
        assert.ok(pages.type?.includes('xml'))
        assert.ok(pages.body.includes('<loc>https://oharatracker.com/fr</loc>'))
        assert.ok(pages.body.includes('<loc>https://oharatracker.com/de/preise</loc>'))
        assert.ok(pages.body.includes('<loc>https://oharatracker.com/es/privacidad</loc>'))
        assert.ok(pages.body.includes('xhtml:link rel="alternate" hreflang="it"'))
        assert.ok(pages.body.includes('hreflang="x-default"'))
        assert.ok(!/<loc>[^<]*\/(profil|connexion|inscription|bibliotheque)</.test(pages.body))
        assert.ok(pages.body.includes('<loc>https://oharatracker.com/fr/faq</loc>'))

        // Accueil + toutes les pages publiques indexables, dans les cinq langues (dérivé de la config, pas figé).
        const { INDEXABLE_PAGES } = await import('../utils/seoRoutes.js')
        const expectedUrls = (1 + INDEXABLE_PAGES.length) * 5
        assert.strictEqual((pages.body.match(/<loc>/g) || []).length, expectedUrls)
    })

    // En dehors de la production, robots.txt doit tout interdire, sinon la préprod se retrouve indexée.
    test('hors prod : crawl interdit', async () => {
        process.env.NODE_ENV = 'test'
        const robotsDev = await get('/robots.txt')
        assert.strictEqual(robotsDev.body.trim(), 'User-agent: *\nDisallow: /')
        process.env.NODE_ENV = 'production'
    })
})
