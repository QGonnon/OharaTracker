import crypto from 'node:crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Origines externes réellement contactées par l'application.
 * Toute nouvelle intégration tierce doit être ajoutée ici, sinon le navigateur
 * la bloquera silencieusement.
 */
const GOOGLE_IDENTITY = 'https://accounts.google.com';
// Le paiement se fait par redirection vers la page hébergée par Stripe :
// aucun script Stripe n'est chargé, seule la navigation sortante doit être permise.
const STRIPE_HOSTED = ['https://checkout.stripe.com', 'https://billing.stripe.com'];

const toOrigin = raw => {
    if (!raw) return null;
    try {
        return new URL(raw).origin;
    } catch {
        return null;
    }
};

/**
 * Origines que le navigateur contacte pour l'API.
 *
 * `PUBLIC_API_URL` doit valoir exactement le `VITE_API_URL` du frontend : c'est
 * l'adresse que le JavaScript appelle. Si l'API est servie depuis une autre
 * origine que le site (api.domaine.com, ou API sur :3000 et site sur :5173),
 * l'omettre ferait bloquer *toutes* les requêtes par la CSP — l'application
 * paraîtrait fonctionner mais aucune donnée ne se chargerait, sans erreur serveur.
 */
const apiOrigins = () => [
    toOrigin(process.env.PUBLIC_API_URL),
    toOrigin(process.env.SITE_URL),
    toOrigin(process.env.APP_URL),
].filter((origin, i, all) => origin && all.indexOf(origin) === i);

/**
 * Génère un nonce par requête et l'expose dans `res.locals.cspNonce`.
 *
 * Les blocs `<script type="application/ld+json">` des données structurées sont
 * inline : sous une CSP stricte, Chrome les bloque s'ils ne portent pas de nonce,
 * et on perdrait les rich results — c'est-à-dire une partie du bénéfice SEO.
 * Le nonce est donc requis, plutôt que d'ouvrir `'unsafe-inline'`.
 */
export const cspNonce = (_req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
};

/**
 * En-têtes de sécurité HTTP.
 *
 * Couvre ce que l'audit « Bonnes pratiques » de Lighthouse contrôle (CSP contre
 * le XSS, `X-Content-Type-Options`, COOP) et ce que l'API n'envoyait pas du tout
 * jusqu'ici : aucune protection d'en-tête n'était configurée.
 */
export const securityHeaders = () => {
    const api = apiOrigins();
    const isProd = process.env.NODE_ENV === 'production';

    return helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],

                // Google Identity Services est le seul script tiers. Le nonce couvre
                // les blocs JSON-LD injectés par le rendu serveur.
                scriptSrc: [
                    "'self'",
                    GOOGLE_IDENTITY,
                    (_req, res) => `'nonce-${res.locals.cspNonce}'`,
                ],

                // Tailwind et PrimeVue posent des styles inline (variables de thème,
                // styles calculés des composants) : impossible de s'en passer ici.
                styleSrc: ["'self'", "'unsafe-inline'"],

                // Les couvertures viennent soit de notre CDN, soit directement des
                // sources tierces (AniList, MangaDex, TMDB…), dont les domaines ne
                // sont pas connus à l'avance : on autorise toute origine HTTPS,
                // ce qui reste sans risque pour des images.
                imgSrc: ["'self'", 'data:', 'blob:', 'https:', ...api],

                fontSrc: ["'self'", 'data:'],
                connectSrc: ["'self'", GOOGLE_IDENTITY, ...api],

                // GSI affiche son bouton et sa fenêtre de consentement dans une iframe.
                frameSrc: ["'self'", GOOGLE_IDENTITY],

                // Le service worker et le manifeste PWA
                workerSrc: ["'self'", 'blob:'],
                manifestSrc: ["'self'"],

                // Empêche l'exfiltration par formulaire ; Stripe est explicitement listé.
                formAction: ["'self'", ...STRIPE_HOSTED],

                // Personne ne doit pouvoir encadrer le site (clickjacking).
                frameAncestors: ["'none'"],
                baseUri: ["'self'"],
                objectSrc: ["'none'"],

                ...(isProd ? { upgradeInsecureRequests: [] } : {}),
            },
        },

        // HSTS n'a de sens que derrière HTTPS : l'activer en local n'apporte rien
        // et peut bloquer l'accès à http://localhost dans le navigateur du dev.
        strictTransportSecurity: isProd
            ? { maxAge: 31536000, includeSubDomains: true, preload: true }
            : false,

        // L'API et le CDN d'images sont consommés depuis une autre origine en
        // développement (Vite sur 5173, API sur 3000) : la valeur `same-origin`
        // par défaut de helmet bloquerait toutes les couvertures.
        crossOriginResourcePolicy: { policy: 'cross-origin' },

        // `credentialless` plutôt que `same-origin` : les images tierces des
        // couvertures resteraient sinon inaccessibles.
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },

        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    });
};

/**
 * Limitation de débit sur les routes d'authentification.
 *
 * Sans elle, `/auth/signin` accepte un nombre illimité de tentatives : un mot de
 * passe de 6 caractères (le minimum accepté à l'inscription) tombe en quelques
 * heures. La limite porte sur l'IP et ne compte que les échecs, pour ne pas
 * pénaliser un utilisateur qui se connecte normalement plusieurs fois.
 */
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
});

/** Limite large sur le reste de l'API : arrête le scraping abusif, pas les utilisateurs. */
export const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Trop de requêtes. Réessayez dans quelques minutes.' },
});
