/**
 * Tests des en-têtes de sécurité (api/seo/security.js).
 *
 * Une CSP trop stricte casse l'application en silence : le navigateur bloque
 * sans erreur visible côté serveur. Ces tests vérifient donc les deux sens —
 * que les protections sont bien posées, ET que tout ce dont l'application a
 * réellement besoin (Google Identity, couvertures tierces, Stripe, JSON-LD)
 * reste autorisé.
 */
import http from 'node:http'
import express from 'express'

process.env.SITE_URL = 'https://oharatracker.com'
process.env.NODE_ENV = 'production'

const { securityHeaders, cspNonce, authRateLimit } = await import('../seo/security.js')

let failures = 0
const check = (label, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected)
    if (!ok) failures++
    console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label}`)
    if (!ok) console.log(`        attendu : ${JSON.stringify(expected)}\n        obtenu  : ${JSON.stringify(actual)}`)
}
const section = title => console.log(`\n=== ${title} ===`)

const app = express()
app.use(cspNonce)
app.use(securityHeaders())
app.get('/ping', (_req, res) => res.json({ ok: true, nonce: res.locals.cspNonce }))
app.use('/auth/signin', authRateLimit)
app.post('/auth/signin', (_req, res) => res.status(401).json({ message: 'nope' }))

const server = http.createServer(app)
await new Promise(resolve => server.listen(0, resolve))
const port = server.address().port

const request = (path, method = 'GET') => new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method }, res => {
        let body = ''
        res.on('data', c => (body += c))
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    })
    req.on('error', reject)
    req.end()
})

const res = await request('/ping')
const csp = res.headers['content-security-policy'] ?? ''

section('En-têtes présents')
check('Content-Security-Policy', Boolean(csp), true)
check('X-Content-Type-Options', res.headers['x-content-type-options'], 'nosniff')
check('Referrer-Policy', res.headers['referrer-policy'], 'strict-origin-when-cross-origin')
check('Strict-Transport-Security (production)', Boolean(res.headers['strict-transport-security']), true)
check('X-Powered-By masqué', res.headers['x-powered-by'], undefined)

section('CSP — protections')
check("frame-ancestors 'none' (anti-clickjacking)", csp.includes("frame-ancestors 'none'"), true)
check("object-src 'none'", csp.includes("object-src 'none'"), true)
check("base-uri 'self'", csp.includes("base-uri 'self'"), true)
check('upgrade-insecure-requests en production', csp.includes('upgrade-insecure-requests'), true)
check("pas d'unsafe-inline sur script-src", /script-src[^;]*'unsafe-inline'/.test(csp), false)
check("pas d'unsafe-eval", csp.includes("'unsafe-eval'"), false)

section("CSP — ce dont l'application a besoin")
check('nonce présent sur script-src (JSON-LD)', /script-src[^;]*'nonce-[A-Za-z0-9+/=]+'/.test(csp), true)
check('Google Identity autorisé (script)', /script-src[^;]*https:\/\/accounts\.google\.com/.test(csp), true)
check('Google Identity autorisé (iframe)', /frame-src[^;]*https:\/\/accounts\.google\.com/.test(csp), true)
check('Google Identity autorisé (XHR)', /connect-src[^;]*https:\/\/accounts\.google\.com/.test(csp), true)
check("API autorisée en connect-src", /connect-src[^;]*https:\/\/oharatracker\.com/.test(csp), true)
check('couvertures tierces autorisées (img https:)', /img-src[^;]*https:/.test(csp), true)
check('images data: et blob: autorisées', /img-src[^;]*data:[^;]*blob:/.test(csp), true)
check('style inline autorisé (Tailwind/PrimeVue)', /style-src[^;]*'unsafe-inline'/.test(csp), true)
check('service worker autorisé', /worker-src[^;]*blob:/.test(csp), true)
check('redirection Stripe autorisée', /form-action[^;]*checkout\.stripe\.com/.test(csp), true)

// Régression : quand l'API est servie depuis une autre origine que le site
// (api.domaine.com, ou API sur :3000 et site sur :5173), une CSP qui ne liste
// que l'origine du site bloque TOUTES les requêtes de données. L'application
// s'affiche mais reste vide, sans la moindre erreur côté serveur.
section('CSP — API sur une origine distincte')
{
    const previous = process.env.PUBLIC_API_URL
    process.env.PUBLIC_API_URL = 'https://api.oharatracker.com'

    const splitApp = express()
    splitApp.use(cspNonce)
    splitApp.use(securityHeaders())
    splitApp.get('/ping', (_req, res) => res.json({ ok: true }))
    const splitServer = http.createServer(splitApp)
    await new Promise(resolve => splitServer.listen(0, resolve))
    const splitPort = splitServer.address().port

    const splitRes = await new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port: splitPort, path: '/ping' }, res => {
            res.resume()
            res.on('end', () => resolve(res))
        }).on('error', reject)
    })
    const splitCsp = splitRes.headers['content-security-policy'] ?? ''

    check('connect-src autorise PUBLIC_API_URL',
        /connect-src[^;]*https:\/\/api\.oharatracker\.com/.test(splitCsp), true)
    check('img-src autorise le CDN de cette origine',
        /img-src[^;]*https:\/\/api\.oharatracker\.com/.test(splitCsp), true)
    check('origine du site toujours autorisée',
        /connect-src[^;]*https:\/\/oharatracker\.com/.test(splitCsp), true)

    splitServer.close()
    if (previous === undefined) delete process.env.PUBLIC_API_URL
    else process.env.PUBLIC_API_URL = previous
}

section('Nonce')
const first = JSON.parse(res.body).nonce
const second = JSON.parse((await request('/ping')).body).nonce
check('nonce généré', Boolean(first), true)
check('nonce différent à chaque requête', first !== second, true)
check('nonce de la réponse présent dans son propre en-tête CSP', csp.includes(`'nonce-${first}'`), true)

section('CDN et images cross-origin')
check('CORP cross-origin (sinon les couvertures sont bloquées)',
    res.headers['cross-origin-resource-policy'], 'cross-origin')
check('COOP autorise les popups (connexion Google)',
    res.headers['cross-origin-opener-policy'], 'same-origin-allow-popups')

section("Limitation de débit sur l'authentification")
let limited = null
for (let i = 1; i <= 12; i++) {
    const r = await request('/auth/signin', 'POST')
    if (r.status === 429 && limited === null) limited = i
}
check('bloque après un nombre raisonnable d’échecs', limited !== null && limited <= 12, true)
console.log(`        (429 à partir de la tentative ${limited})`)

// Hors production, HSTS ne doit pas être envoyé : le navigateur mémoriserait
// localhost comme HTTPS-only et bloquerait l'accès en développement.
section('Hors production')
process.env.NODE_ENV = 'development'
const devApp = express()
devApp.use(cspNonce)
devApp.use(securityHeaders())
devApp.get('/ping', (_req, res) => res.json({ ok: true }))
const devServer = http.createServer(devApp)
await new Promise(r => devServer.listen(0, r))
const devPort = devServer.address().port
const devRes = await new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: devPort, path: '/ping' }, r => {
        r.resume()
        r.on('end', () => resolve(r))
    }).on('error', reject)
})
check('pas de HSTS en développement', devRes.headers['strict-transport-security'], undefined)
check('pas d’upgrade-insecure-requests en développement',
    (devRes.headers['content-security-policy'] ?? '').includes('upgrade-insecure-requests'), false)
devServer.close()

server.close()
console.log(`\n${failures === 0 ? '✅ tous les tests passent' : `❌ ${failures} test(s) en échec`}`)
process.exit(failures === 0 ? 0 : 1)
