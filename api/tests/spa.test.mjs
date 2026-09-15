// Tests du middleware de rendu serveur des métadonnées (api/seo/spa.js).
import http from 'node:http'
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

process.env.SITE_URL = 'https://oharatracker.com'
process.env.NODE_ENV = 'production'

const { createSpaMiddleware } = await import('../seo/spa.js')

// Nécessite un build du frontend : sans frontend/dist/index.html le middleware ne se crée pas.
const spa = createSpaMiddleware()
const skip = spa ? false : 'frontend/dist absent — lancez `npm run build` dans frontend/'

describe('Middleware SPA (rendu SSR des métadonnées)', { skip }, () => {
    let server, port

    before(async () => {
        const app = express()
        app.use(spa)
        server = http.createServer(app)
        await new Promise(r => server.listen(0, r))
        port = server.address().port
    })

    after(() => server.close())

    const get = (path, headers = {}) => new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port, path, headers }, res => {
            let body = ''
            res.on('data', c => (body += c))
            res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body }))
        }).on('error', reject)
    })

    describe('Redirections 301 vers la forme canonique', () => {
        test('/ -> 301 /fr (Accept-Language)', async () => {
            const root = await get('/', { 'accept-language': 'fr-FR,fr;q=0.9' })
            assert.strictEqual(root.status, 301)
            assert.strictEqual(root.location, '/fr')
        })

        test('/ -> /de pour un visiteur allemand', async () => {
            const rootDe = await get('/', { 'accept-language': 'de-DE,de;q=0.9' })
            assert.strictEqual(rootDe.location, '/de')
        })

        test('/pricing -> 301 /fr/tarifs', async () => {
            const legacy = await get('/pricing', { 'accept-language': 'fr' })
            assert.strictEqual(legacy.status, 301)
            assert.strictEqual(legacy.location, '/fr/tarifs')
        })

        test('/home -> /it', async () => {
            const legacyHome = await get('/home', { 'accept-language': 'it' })
            assert.strictEqual(legacyHome.location, '/it')
        })

        test('query preservee dans la redirection', async () => {
            const withQuery = await get('/pricing?utm_source=discord', { 'accept-language': 'es' })
            assert.strictEqual(withQuery.location, '/es/precios?utm_source=discord')
        })
    })

    describe('Page rendue cote serveur', () => {
        test('/fr/tarifs', async () => {
            const fr = await get('/fr/tarifs')
            assert.strictEqual(fr.status, 200)
            assert.match(fr.body, /<html[^>]*\slang="fr"/)
            assert.ok(fr.body.includes('<title>Tarifs — offres gratuite, Perso et Pro | Ohara Tracker</title>'))
            assert.ok(fr.body.includes('<link rel="canonical" href="https://oharatracker.com/fr/tarifs">'))
            assert.ok(fr.body.includes('hreflang="de" href="https://oharatracker.com/de/preise"'))
            assert.ok(fr.body.includes('hreflang="x-default" href="https://oharatracker.com/en/pricing"'))
            assert.ok(fr.body.includes('property="og:url" content="https://oharatracker.com/fr/tarifs"'))
            assert.ok(fr.body.includes('"@type":"BreadcrumbList"'))
            assert.strictEqual((fr.body.match(/<title>/g) || []).length, 1)
            assert.strictEqual((fr.body.match(/name="description"/g) || []).length, 1)
        })

        test('/de/datenschutz', async () => {
            const de = await get('/de/datenschutz')
            assert.match(de.body, /<html[^>]*\slang="de"/)
            assert.ok(de.body.includes('Datenschutzerkl'))
        })
    })

    describe('Pages privees', () => {
        test('/fr/profil', async () => {
            const profile = await get('/fr/profil')
            assert.strictEqual(profile.status, 200)
            assert.ok(profile.body.includes('content="noindex, nofollow"'))
            assert.ok(!profile.body.includes('rel="alternate"'))
        })
    })

    describe('404 reelles', () => {
        test('/fr/cette-page-nexiste-pas', async () => {
            const missing = await get('/fr/cette-page-nexiste-pas')
            assert.strictEqual(missing.status, 404)
            assert.ok(missing.body.includes('content="noindex, nofollow"'))
            assert.ok(missing.body.includes('Cette page n'))
        })
    })

    describe('FAQ — balisage rendu côté serveur', () => {
        test('FAQPage présent avant exécution du JS', async () => {
            const faq = await get('/fr/faq')
            assert.ok(faq.body.includes('"@type":"FAQPage"'))
            assert.ok(faq.body.includes('"@type":"Question"'))
        })

        test('la FAQ ne fuite pas sur la page tarifs', async () => {
            const tarifs = await get('/fr/tarifs')
            assert.ok(!tarifs.body.includes('FAQPage'))
        })
    })

    describe('Accueil', () => {
        test('/en', async () => {
            const home = await get('/en')
            assert.ok(home.body.includes('"@type":"WebSite"'))
            assert.ok(home.body.includes('"@type":"SearchAction"'))
            assert.ok(home.body.includes('"@type":"Organization"'))
            assert.ok(home.body.includes('/en/search?search_term_string') || home.body.includes('search?q={search_term_string}'))
        })
    })
})
