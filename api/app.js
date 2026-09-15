import express from 'express';
import routes from './routes/index.js';
import seoRoutes from './routes/seo.js';
import stripeWebhookHandler from './routes/stripeWebhook.js';
import { securityHeaders, cspNonce, authRateLimit, apiRateLimit } from './seo/security.js';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function startApp(){
    const app = express();
    const cdnPath = path.resolve(process.cwd(), '../cdn');
    const distPath = path.resolve(process.cwd(), '../frontend/dist');

    // Le nonce doit exister avant que la CSP ne soit calculée : il y est référencé.
    app.use(cspNonce);
    app.use(securityHeaders());

    app.use(compression());

    // Monté avant tout rate limiting : la signature Stripe fait foi.
    app.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // robots.txt/sitemap.xml doivent rester à la racine, montés avant tout le reste.
    app.use('/', seoRoutes);

    app.use('/cdn', express.static(cdnPath, {
        maxAge: '1y',
        immutable: true,
    }));

    app.use('/api/auth/signin', authRateLimit);
    app.use('/api/auth/signup', authRateLimit);
    app.use('/api/auth/google', authRateLimit);
    app.use('/api/auth/change-password', authRateLimit);

    app.use('/api', apiRateLimit, routes)

    // Avant le fallback SPA : un endpoint inconnu doit répondre en JSON, pas en HTML.
    app.use('/api', (_req, res) => res.status(404).json({ message: 'Endpoint introuvable' }));

    // En dev c'est Vite qui sert le front et proxifie /api, /cdn et les fichiers SEO.
    if (process.env.NODE_ENV === 'production') {
        app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '1y', immutable: true }));
        app.use(express.static(distPath, { index: false }));
        app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
    }

    app.listen(3000, () => {
        console.log('🔧 Serveur API démarré sur le port 3000');
    });
}

export default startApp;
