/**
 * Tests du middleware de rendu serveur des métadonnées (api/seo/spa.js).
 *
 * Nécessite un build du frontend : sans frontend/dist/index.html le middleware
 * ne se crée pas et le test est ignoré (lancer `npm run build` dans frontend/).
 *
 * Vérifie ce qu'un robot reçoit réellement : redirections 301 vers l'URL
 * canonique, vrais 404, et un <head> unique et complet par page.
 */
import http from 'node:http'
import express from 'express'

process.env.SITE_URL = 'https://oharatracker.com'
process.env.NODE_ENV = 'production'

const { createSpaMiddleware } = await import('../seo/spa.js')

const spa = createSpaMiddleware()
if (!spa) {
    console.log('⏭️  frontend/dist absent — test ignoré (lancez `npm run build` dans frontend/).')
    process.exit(0)
}

const app = express()
app.use(spa)
const server = http.createServer(app)
await new Promise(r => server.listen(0, r))
const port = server.address().port

const get = (path, headers = {}) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path, headers }, res => {
    let body = ''
    res.on('data', c => (body += c))
    res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body }))
  }).on('error', reject)
})

let failures = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label}`)
  if (!ok) console.log(`        attendu : ${JSON.stringify(expected)}\n        obtenu  : ${JSON.stringify(actual)}`)
}

console.log('=== Redirections 301 vers la forme canonique ===')
const root = await get('/', { 'accept-language': 'fr-FR,fr;q=0.9' })
check('/ -> 301', root.status, 301)
check('/ -> /fr (Accept-Language)', root.location, '/fr')

const rootDe = await get('/', { 'accept-language': 'de-DE,de;q=0.9' })
check('/ -> /de pour un visiteur allemand', rootDe.location, '/de')

const legacy = await get('/pricing', { 'accept-language': 'fr' })
check('/pricing -> 301', legacy.status, 301)
check('/pricing -> /fr/tarifs', legacy.location, '/fr/tarifs')

const legacyHome = await get('/home', { 'accept-language': 'it' })
check('/home -> /it', legacyHome.location, '/it')

const withQuery = await get('/pricing?utm_source=discord', { 'accept-language': 'es' })
check('query preservee dans la redirection', withQuery.location, '/es/precios?utm_source=discord')

console.log('\n=== Page rendue cote serveur ===')
const fr = await get('/fr/tarifs')
check('200', fr.status, 200)
check('lang=fr sur <html>', /<html[^>]*\slang="fr"/.test(fr.body), true)
check('titre FR', fr.body.includes('<title>Tarifs — offres gratuite, Perso et Pro | Ohara Tracker</title>'), true)
check('canonical', fr.body.includes('<link rel="canonical" href="https://oharatracker.com/fr/tarifs">'), true)
check('hreflang de -> /de/preise', fr.body.includes('hreflang="de" href="https://oharatracker.com/de/preise"'), true)
check('x-default -> /en/pricing', fr.body.includes('hreflang="x-default" href="https://oharatracker.com/en/pricing"'), true)
check('og:url', fr.body.includes('property="og:url" content="https://oharatracker.com/fr/tarifs"'), true)
check('fil d ariane JSON-LD', fr.body.includes('"@type":"BreadcrumbList"'), true)
check('un seul <title>', (fr.body.match(/<title>/g) || []).length, 1)
check('une seule meta description', (fr.body.match(/name="description"/g) || []).length, 1)

const de = await get('/de/datenschutz')
check('page DE : lang=de', /<html[^>]*\slang="de"/.test(de.body), true)
check('page DE : titre traduit', de.body.includes('Datenschutzerkl'), true)

console.log('\n=== Pages privees ===')
const profile = await get('/fr/profil')
check('profil : 200', profile.status, 200)
check('profil : noindex', profile.body.includes('content="noindex, nofollow"'), true)
check('profil : aucun hreflang', profile.body.includes('rel="alternate"'), false)

console.log('\n=== 404 reelles ===')
const missing = await get('/fr/cette-page-nexiste-pas')
check('statut 404 (plus de soft 404)', missing.status, 404)
check('404 : noindex', missing.body.includes('content="noindex, nofollow"'), true)
check('404 : titre FR', missing.body.includes("Cette page n"), true)

console.log('\n=== FAQ — balisage rendu côté serveur ===')
const faq = await get('/fr/faq')
check('FAQPage présent avant exécution du JS', faq.body.includes('"@type":"FAQPage"'), true)
check('au moins une question rendue', faq.body.includes('"@type":"Question"'), true)
check('la FAQ ne fuite pas sur la page tarifs', (await get('/fr/tarifs')).body.includes('FAQPage'), false)

console.log('\n=== Accueil ===')
const home = await get('/en')
check('WebSite JSON-LD', home.body.includes('"@type":"WebSite"'), true)
check('SearchAction (sitelinks searchbox)', home.body.includes('"@type":"SearchAction"'), true)
check('Organization JSON-LD', home.body.includes('"@type":"Organization"'), true)
check('urlTemplate de recherche', home.body.includes('/en/search?search_term_string') || home.body.includes('search?q={search_term_string}'), true)

server.close()
console.log(`\n${failures === 0 ? '✅ tous les tests passent' : `❌ ${failures} test(s) en echec`}`)
process.exit(failures === 0 ? 0 : 1)
