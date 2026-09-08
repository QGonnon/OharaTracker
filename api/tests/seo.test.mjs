/**
 * Tests SEO — à lancer depuis `api/` avec `npm run test:seo`.
 *
 * Couvre les deux garanties qui cassent silencieusement le référencement si
 * elles régressent : la résolution d'une URL vers la bonne page/langue, et le
 * contenu exact du <head> rendu côté serveur (canonical, hreflang, robots).
 * Aucun accès à la base : le sitemap des œuvres n'est pas testé ici.
 */
import http from 'node:http'
import express from 'express'

process.env.SITE_URL = 'https://oharatracker.com'
process.env.NODE_ENV = 'production'

const {
    resolvePath, renderHead, negotiateLocale, t, translationsAvailable,
    homePath, pagePath, mediaPath,
} = await import('../seo/head.js')
const { default: seoRoutes } = await import('../routes/seo.js')
const { slugify, slugifyLegacy, resolveMediaKind } = await import('../utils/slug.js')

let failures = 0
const check = (label, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected)
    if (!ok) failures++
    console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label}`)
    if (!ok) console.log(`        attendu : ${JSON.stringify(expected)}\n        obtenu  : ${JSON.stringify(actual)}`)
}
const section = title => console.log(`\n=== ${title} ===`)

// ---------------------------------------------------------------------------
section('Slugs')
// ---------------------------------------------------------------------------
check('titre simple', slugify('One Piece'), 'one-piece')
check('accents rabattus, pas supprimés', slugify('Ōkami to Kōshinryō'), 'okami-to-koshinryo')
check('CJK conservé', slugify('進撃の巨人'), '進撃の巨人')
check('apostrophe collée', slugify("L'Attaque des Titans"), 'lattaque-des-titans')
check('slash en séparateur', slugify('Fate/stay night'), 'fate-stay-night')
check('esperluette translittérée', slugify('Café & Cie'), 'cafe-and-cie')
check('ancien slug perdait les accents', slugifyLegacy('Ōkami'), 'kami')
check('ancien slug vidait le CJK', slugifyLegacy('進撃の巨人'), '')
check('type BDD anime → serie', resolveMediaKind('Anime'), 'serie')
check('type BDD manga → lecture', resolveMediaKind('Manga'), 'lecture')
check('type inconnu → lecture', resolveMediaKind(null), 'lecture')

// ---------------------------------------------------------------------------
section('Traductions')
// ---------------------------------------------------------------------------
check('fichiers de locale trouvés', translationsAvailable(), true)
check('titre DE tarifs', t('de', 'seo.pricing.title'), 'Preise — Gratis, Perso und Pro')
check('interpolation ES', t('es', 'seo.media.serie.title', { title: 'One Piece' }),
    'One Piece: episodios, temporadas y seguimiento')
check('clé absente → chaîne vide', t('fr', 'seo.inexistant.title'), '')

// ---------------------------------------------------------------------------
section('Résolution des URL')
// ---------------------------------------------------------------------------
check('racine', resolvePath('/'), { kind: 'home', locale: 'en', localeInPath: false })
check('accueil FR', resolvePath('/fr'), { kind: 'home', locale: 'fr', localeInPath: true })
check('/home hérité', resolvePath('/home'), { kind: 'home', locale: 'en', localeInPath: false })
check('page FR', resolvePath('/fr/tarifs'),
    { kind: 'page', locale: 'fr', localeInPath: true, pageKey: 'pricing' })
check('page DE', resolvePath('/de/preise'),
    { kind: 'page', locale: 'de', localeInPath: true, pageKey: 'pricing' })
check('/pricing hérité', resolvePath('/pricing'),
    { kind: 'page', locale: 'en', localeInPath: false, pageKey: 'pricing' })
check('œuvre FR', resolvePath('/fr/manga/one-piece'),
    { kind: 'media', locale: 'fr', localeInPath: true, mediaKind: 'lecture', slug: 'one-piece' })
check('œuvre ES (pelicula)', resolvePath('/es/pelicula/akira'),
    { kind: 'media', locale: 'es', localeInPath: true, mediaKind: 'film', slug: 'akira' })
check('/anime/x hérité', resolvePath('/anime/naruto'),
    { kind: 'media', locale: 'en', localeInPath: false, mediaKind: 'serie', slug: 'naruto' })
check('URL inconnue → unknown', resolvePath('/fr/nimportequoi'),
    { kind: 'unknown', locale: 'fr', localeInPath: true })
check('slug encodé décodé', resolvePath(`/fr/manga/${encodeURIComponent('進撃の巨人')}`).slug, '進撃の巨人')

section('Négociation de langue')
check('de-DE prioritaire', negotiateLocale('de-DE,de;q=0.9,en;q=0.8'), 'de')
check('langue non couverte → défaut', negotiateLocale('ja-JP,ja;q=0.9'), 'en')
check('q-values respectées', negotiateLocale('pt;q=0.9,it;q=0.8'), 'it')

section('Construction des chemins')
check('homePath fr', homePath('fr'), '/fr')
check('pagePath de/privacy', pagePath('privacy', 'de'), '/de/datenschutz')
check('mediaPath it/film', mediaPath('film', 'akira', 'it'), '/it/film/akira')
check('mediaPath encode les espaces', mediaPath('lecture', 'a b', 'fr'), '/fr/manga/a%20b')

// ---------------------------------------------------------------------------
section('Rendu du <head>')
// ---------------------------------------------------------------------------
const head = renderHead({
    locale: 'fr',
    pathFor: l => mediaPath('lecture', 'one-piece', l),
    title: 'One Piece : chapitres',
    description: 'Suivez One Piece',
    image: 'https://oharatracker.com/cdn/x.jpg',
    jsonLd: [{ '@type': 'ComicSeries', name: 'One Piece' }],
})
check('titre suffixé du nom du site',
    head.includes('<title>One Piece : chapitres | Ohara Tracker</title>'), true)
check('canonical dans la langue courante',
    head.includes('<link rel="canonical" href="https://oharatracker.com/fr/manga/one-piece">'), true)
check('hreflang es', head.includes('hreflang="es" href="https://oharatracker.com/es/manga/one-piece"'), true)
check('x-default sur en', head.includes('hreflang="x-default" href="https://oharatracker.com/en/manga/one-piece"'), true)
check('5 langues + x-default', (head.match(/rel="alternate"/g) || []).length, 6)
check('og:image', head.includes('content="https://oharatracker.com/cdn/x.jpg"'), true)
check('grande vignette autorisée', head.includes('max-image-preview:large'), true)
check('JSON-LD injecté', head.includes('"@type":"ComicSeries"'), true)

const noindexHead = renderHead({ locale: 'fr', pathFor: homePath, title: 'Profil', description: 'x', noindex: true })
check('noindex : aucun hreflang', noindexHead.includes('rel="alternate"'), false)
check('noindex, nofollow', noindexHead.includes('content="noindex, nofollow"'), true)

section('Échappement')
const escaped = renderHead({
    locale: 'fr', pathFor: homePath,
    title: 'Fate/stay "night" & <Cie>',
    description: 'a "b" & <c>',
})
check('title échappé', escaped.includes('Fate/stay &quot;night&quot; &amp; &lt;Cie&gt;'), true)
check('description échappée', escaped.includes('content="a &quot;b&quot; &amp; &lt;c&gt;"'), true)
check('JSON-LD : < échappé',
    renderHead({
        locale: 'fr', pathFor: homePath, title: 'x', description: 'x',
        jsonLd: [{ name: '</script><script>alert(1)</script>' }],
    }).includes('</script><script>alert(1)'), false)

// ---------------------------------------------------------------------------
section('robots.txt et sitemap des pages')
// ---------------------------------------------------------------------------
const app = express()
app.use('/', seoRoutes)
const server = http.createServer(app)
await new Promise(resolve => server.listen(0, resolve))
const port = server.address().port

const get = path => new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path }, res => {
        let body = ''
        res.on('data', chunk => (body += chunk))
        res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body }))
    }).on('error', reject)
})

const robots = await get('/robots.txt')
check('robots 200', robots.status, 200)
check('robots text/plain', robots.type?.startsWith('text/plain'), true)
check('crawl autorisé', robots.body.includes('Allow: /'), true)
check('profil FR bloqué', robots.body.includes('Disallow: /fr/profil'), true)
check('connexion ES bloquée', robots.body.includes('Disallow: /es/iniciar-sesion'), true)
check('sitemap déclaré', robots.body.includes('Sitemap: https://oharatracker.com/sitemap.xml'), true)
check('page publique non bloquée', robots.body.includes('Disallow: /fr/tarifs'), false)

const pages = await get('/sitemap-pages.xml')
check('sitemap 200', pages.status, 200)
check('sitemap xml', pages.type?.includes('xml'), true)
check('accueil FR listé', pages.body.includes('<loc>https://oharatracker.com/fr</loc>'), true)
check('tarifs DE listés', pages.body.includes('<loc>https://oharatracker.com/de/preise</loc>'), true)
check('confidentialité ES listée', pages.body.includes('<loc>https://oharatracker.com/es/privacidad</loc>'), true)
check('alternates hreflang', pages.body.includes('xhtml:link rel="alternate" hreflang="it"'), true)
check('x-default', pages.body.includes('hreflang="x-default"'), true)
check('aucune page privée', /<loc>[^<]*\/(profil|connexion|inscription|bibliotheque)</.test(pages.body), false)
check('14 pages × 5 langues', (pages.body.match(/<loc>/g) || []).length, 14 * 5)

// En dehors de la production, robots.txt doit tout interdire : sinon la préprod
// se retrouve indexée et concurrence la production sur les mêmes contenus.
process.env.NODE_ENV = 'test'
const robotsDev = await get('/robots.txt')
check('hors prod : crawl interdit', robotsDev.body.trim(), 'User-agent: *\nDisallow: /')

server.close()
console.log(`\n${failures === 0 ? '✅ tous les tests passent' : `❌ ${failures} test(s) en échec`}`)
process.exit(failures === 0 ? 0 : 1)
