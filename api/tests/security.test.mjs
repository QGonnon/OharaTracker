// Tests des en-têtes de sécurité (api/seo/security.js).
import http from 'node:http'
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

process.env.SITE_URL = 'https://oharatracker.com'
process.env.NODE_ENV = 'production'

const { securityHeaders, cspNonce, authRateLimit } = await import('../seo/security.js')

function buildApp() {
    const app = express()
    app.use(cspNonce)
    app.use(securityHeaders())
    app.get('/ping', (_req, res) => res.json({ ok: true, nonce: res.locals.cspNonce }))
    app.use('/auth/signin', authRateLimit)
    app.post('/auth/signin', (_req, res) => res.status(401).json({ message: 'nope' }))
    return app
}

function requestFrom(port) {
    return (path, method = 'GET') => new Promise((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port, path, method }, res => {
            let body = ''
            res.on('data', c => (body += c))
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
        })
        req.on('error', reject)
        req.end()
    })
}

describe('En-têtes de sécurité', () => {
    let server, port, request, res, csp

    before(async () => {
        server = http.createServer(buildApp())
        await new Promise(resolve => server.listen(0, resolve))
        port = server.address().port
        request = requestFrom(port)
        res = await request('/ping')
        csp = res.headers['content-security-policy'] ?? ''
    })

    after(() => server.close())

    describe('En-têtes présents', () => {
        test('Content-Security-Policy', () => assert.ok(csp))
        test('X-Content-Type-Options', () => assert.strictEqual(res.headers['x-content-type-options'], 'nosniff'))
        test('Referrer-Policy', () => assert.strictEqual(res.headers['referrer-policy'], 'strict-origin-when-cross-origin'))
        test('Strict-Transport-Security (production)', () => assert.ok(res.headers['strict-transport-security']))
        test('X-Powered-By masqué', () => assert.strictEqual(res.headers['x-powered-by'], undefined))
    })

    describe('CSP — protections', () => {
        test("frame-ancestors 'none' (anti-clickjacking)", () => assert.ok(csp.includes("frame-ancestors 'none'")))
        test("object-src 'none'", () => assert.ok(csp.includes("object-src 'none'")))
        test("base-uri 'self'", () => assert.ok(csp.includes("base-uri 'self'")))
        test('upgrade-insecure-requests en production', () => assert.ok(csp.includes('upgrade-insecure-requests')))
        test("pas d'unsafe-inline sur script-src", () => assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp)))
        test("pas d'unsafe-eval", () => assert.ok(!csp.includes("'unsafe-eval'")))
    })

    describe("CSP — ce dont l'application a besoin", () => {
        test('nonce présent sur script-src (JSON-LD)', () => assert.match(csp, /script-src[^;]*'nonce-[A-Za-z0-9+/=]+'/))
        test('Google Identity autorisé (script)', () => assert.match(csp, /script-src[^;]*https:\/\/accounts\.google\.com/))
        test('Google Identity autorisé (iframe)', () => assert.match(csp, /frame-src[^;]*https:\/\/accounts\.google\.com/))
        test('Google Identity autorisé (XHR)', () => assert.match(csp, /connect-src[^;]*https:\/\/accounts\.google\.com/))
        test('API autorisée en connect-src', () => assert.match(csp, /connect-src[^;]*https:\/\/oharatracker\.com/))
        test('couvertures tierces autorisées (img https:)', () => assert.match(csp, /img-src[^;]*https:/))
        test('images data: et blob: autorisées', () => assert.match(csp, /img-src[^;]*data:[^;]*blob:/))
        test('style inline autorisé (Tailwind/PrimeVue)', () => assert.match(csp, /style-src[^;]*'unsafe-inline'/))
        test('service worker autorisé', () => assert.match(csp, /worker-src[^;]*blob:/))
        test('redirection Stripe autorisée', () => assert.match(csp, /form-action[^;]*checkout\.stripe\.com/))
    })

    // Régression : une CSP qui ne liste que l'origine du site bloque toutes les requêtes de données quand l'API est servie depuis une autre origine.
    describe('CSP — API sur une origine distincte', () => {
        let splitServer, splitCsp

        before(async () => {
            const previous = process.env.PUBLIC_API_URL
            process.env.PUBLIC_API_URL = 'https://api.oharatracker.com'

            const splitApp = express()
            splitApp.use(cspNonce)
            splitApp.use(securityHeaders())
            splitApp.get('/ping', (_req, res) => res.json({ ok: true }))
            splitServer = http.createServer(splitApp)
            await new Promise(resolve => splitServer.listen(0, resolve))
            const splitPort = splitServer.address().port

            const splitRes = await new Promise((resolve, reject) => {
                http.get({ host: '127.0.0.1', port: splitPort, path: '/ping' }, res => {
                    res.resume()
                    res.on('end', () => resolve(res))
                }).on('error', reject)
            })
            splitCsp = splitRes.headers['content-security-policy'] ?? ''

            if (previous === undefined) delete process.env.PUBLIC_API_URL
            else process.env.PUBLIC_API_URL = previous
        })

        after(() => splitServer.close())

        test('connect-src autorise PUBLIC_API_URL', () => assert.match(splitCsp, /connect-src[^;]*https:\/\/api\.oharatracker\.com/))
        test('img-src autorise le CDN de cette origine', () => assert.match(splitCsp, /img-src[^;]*https:\/\/api\.oharatracker\.com/))
        test('origine du site toujours autorisée', () => assert.match(splitCsp, /connect-src[^;]*https:\/\/oharatracker\.com/))
    })

    describe('Nonce', () => {
        test('nonce généré et différent à chaque requête', async () => {
            const first = JSON.parse(res.body).nonce
            const second = JSON.parse((await request('/ping')).body).nonce
            assert.ok(first)
            assert.notStrictEqual(first, second)
            assert.ok(csp.includes(`'nonce-${first}'`))
        })
    })

    describe('CDN et images cross-origin', () => {
        test('CORP cross-origin (sinon les couvertures sont bloquées)', () =>
            assert.strictEqual(res.headers['cross-origin-resource-policy'], 'cross-origin'))
        test('COOP autorise les popups (connexion Google)', () =>
            assert.strictEqual(res.headers['cross-origin-opener-policy'], 'same-origin-allow-popups'))
    })

    describe("Limitation de débit sur l'authentification", () => {
        test('bloque après un nombre raisonnable d’échecs', async () => {
            let limited = null
            for (let i = 1; i <= 12; i++) {
                const r = await request('/auth/signin', 'POST')
                if (r.status === 429 && limited === null) limited = i
            }
            assert.ok(limited !== null && limited <= 12)
        })
    })
})

// Hors production, HSTS ne doit pas être envoyé, sinon le navigateur mémorise localhost comme HTTPS-only.
describe('Hors production', () => {
    let devServer, devRes

    before(async () => {
        process.env.NODE_ENV = 'development'
        devServer = http.createServer(buildApp())
        await new Promise(r => devServer.listen(0, r))
        const devPort = devServer.address().port
        devRes = await new Promise((resolve, reject) => {
            http.get({ host: '127.0.0.1', port: devPort, path: '/ping' }, r => {
                r.resume()
                r.on('end', () => resolve(r))
            }).on('error', reject)
        })
    })

    after(() => devServer.close())

    test('pas de HSTS en développement', () => assert.strictEqual(devRes.headers['strict-transport-security'], undefined))
    test('pas d’upgrade-insecure-requests en développement', () =>
        assert.ok(!(devRes.headers['content-security-policy'] ?? '').includes('upgrade-insecure-requests')))
})
