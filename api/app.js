import express from 'express';
import routes from './routes/index.js';
import seoRoutes from './routes/seo.js';
import stripeWebhookHandler from './routes/stripeWebhook.js';
import { createSpaMiddleware } from './seo/spa.js';
import { securityHeaders, cspNonce, authRateLimit, apiRateLimit } from './seo/security.js';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const frontendUrl = process.env.APP_URL + ':' + process.env.APP_PORT;

function startApp(){
    const app = express();
    const cdnPath = path.resolve(process.cwd(), '../cdn');

    const corsOptions = {
        origin: [frontendUrl, 'http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };

    app.use(cors(corsOptions));

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

    app.use('/auth/signin', authRateLimit);
    app.use('/auth/signup', authRateLimit);
    app.use('/auth/google', authRateLimit);
    app.use('/auth/change-password', authRateLimit);

    app.use('/', apiRateLimit, routes)

    // Absent si frontend/dist n'existe pas (dev : Vite sert le frontend).
    const spa = createSpaMiddleware();
    if (spa) app.use(spa);

    app.listen(3000, () => {
        console.log('🔧 Serveur API démarré sur le port 3000');
    });
}

export default startApp;
