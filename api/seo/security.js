import crypto from 'node:crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Toute nouvelle intégration tierce doit être ajoutée ici, sinon le navigateur la bloque.
const GOOGLE_IDENTITY = 'https://accounts.google.com';
const STRIPE_HOSTED = ['https://checkout.stripe.com', 'https://billing.stripe.com'];

const toOrigin = raw => {
    if (!raw) return null;
    try {
        return new URL(raw).origin;
    } catch {
        return null;
    }
};

// PUBLIC_API_URL doit valoir exactement VITE_API_URL, sinon la CSP bloque les requêtes.
const apiOrigins = () => [
    toOrigin(process.env.PUBLIC_API_URL),
    toOrigin(process.env.SITE_URL),
    toOrigin(process.env.APP_URL),
].filter((origin, i, all) => origin && all.indexOf(origin) === i);

// Nonce par requête pour les blocs JSON-LD, requis par la CSP stricte plutôt que 'unsafe-inline'.
export const cspNonce = (_req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
};

export const securityHeaders = () => {
    const api = apiOrigins();
    const isProd = process.env.NODE_ENV === 'production';

    return helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],

                scriptSrc: [
                    "'self'",
                    GOOGLE_IDENTITY,
                    (_req, res) => `'nonce-${res.locals.cspNonce}'`,
                ],

                // Tailwind/PrimeVue posent des styles inline, impossible de s'en passer.
                styleSrc: ["'self'", "'unsafe-inline'"],

                // Couvertures venant du CDN ou de sources tierces (AniList, MangaDex, TMDB...) inconnues à l'avance.
                imgSrc: ["'self'", 'data:', 'blob:', 'https:', ...api],

                fontSrc: ["'self'", 'data:'],
                connectSrc: ["'self'", GOOGLE_IDENTITY, ...api],
                frameSrc: ["'self'", GOOGLE_IDENTITY],
                workerSrc: ["'self'", 'blob:'],
                manifestSrc: ["'self'"],
                formAction: ["'self'", ...STRIPE_HOSTED],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"],
                objectSrc: ["'none'"],

                ...(isProd ? { upgradeInsecureRequests: [] } : {}),
            },
        },

        // Désactivé hors prod : bloquerait l'accès à http://localhost en dev.
        strictTransportSecurity: isProd
            ? { maxAge: 31536000, includeSubDomains: true, preload: true }
            : false,

        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },

        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    });
};

// Ne compte que les échecs, par IP, pour ne pas pénaliser les connexions normales.
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
