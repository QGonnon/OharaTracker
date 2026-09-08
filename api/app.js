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

    // CORS configuration pour permettre les requêtes du frontend
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

    // Compression gzip/brotli. Le JSON du catalogue et le HTML se compriment à
    // environ un dixième de leur taille : c'est le gain le moins cher sur le
    // temps de chargement, donc sur les Core Web Vitals.
    app.use(compression());

    // Le webhook Stripe est monté avant toute limitation de débit : c'est Stripe
    // qui appelle, la signature fait foi, et une rafale de retries ne doit pas
    // être rejetée.
    app.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

    // Middleware pour parser JSON
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // robots.txt et sitemap.xml doivent être servis à la racine du domaine public :
    // montés avant tout le reste pour qu'aucune autre route ne les intercepte.
    app.use('/', seoRoutes);

    // Les couvertures ne changent jamais une fois écrites (nom dérivé du contenu) :
    // un an de cache navigateur évite de les retélécharger à chaque visite.
    app.use('/cdn', express.static(cdnPath, {
        maxAge: '1y',
        immutable: true,
    }));

    // Connexion et inscription : protection contre le bourrage d'identifiants.
    app.use('/auth/signin', authRateLimit);
    app.use('/auth/signup', authRateLimit);
    app.use('/auth/google', authRateLimit);
    app.use('/auth/change-password', authRateLimit);

    app.use('/', apiRateLimit, routes)

    // Sert l'application compilée avec ses métadonnées rendues côté serveur.
    // Absent si `frontend/dist` n'existe pas : en développement le frontend est
    // servi par Vite, et l'API reste une API pure.
    const spa = createSpaMiddleware();
    if (spa) app.use(spa);

    app.listen(3000, () => {
        console.log('🔧 Serveur API démarré sur le port 3000');
    });
}

export default startApp;
