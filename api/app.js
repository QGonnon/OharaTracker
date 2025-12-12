import express from 'express';
import routes from './routes/index.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

function startApp(){
    const app = express();

    // CORS configuration pour permettre les requêtes du frontend
    const corsOptions = {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };
    
    app.use(cors(corsOptions));

    // Middleware pour parser JSON
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use('/', routes)
    
    app.listen(3000, () => {
        console.log('🔧 Serveur API démarré sur le port 3000');
    });
}

export default startApp;