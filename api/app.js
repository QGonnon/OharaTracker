import express from 'express';
import routes from './routes/index.js'

function startApp(){
    const app = express();

    app.use('/', routes)
    
    app.listen(3000, () => {
        console.log('🔧 Serveur API démarré sur le port 3000');
    });
}

export default startApp;