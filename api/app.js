import express from 'express';
import routes from './routes/index.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

function startApp(){
    const app = express();

    const cors_origin = process.env.APP_URL+":"+process.env.APP_PORT;
    console.log(cors_origin);

    app.use(cors({
        origin: cors_origin
    }));

    app.use('/', routes)
    
    app.listen(3000, () => {
        console.log('🔧 Serveur API démarré sur le port 3000');
    });
}

export default startApp;