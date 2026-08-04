import express from 'express';
import routes from './routes/index.js';
import stripeWebhookHandler from './routes/stripeWebhook.js';
import cors from 'cors';
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

    app.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

    // Middleware pour parser JSON
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/cdn', express.static(cdnPath));
    app.use('/', routes)
    
    app.listen(3000, () => {
        console.log('🔧 Serveur API démarré sur le port 3000');
    });
}

export default startApp;
