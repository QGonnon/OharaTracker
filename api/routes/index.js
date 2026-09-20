import express from 'express';
import chapters from './chapitres.js';
import auth from './auth.js';
import library from './library.js';
import client from './client.js';
import notifications from './notifications.js';
import stripeRoutes from './stripe.js';
import tags from './tags.js';


const router = express.Router();

router
    .get('/', (req, res) => {
        res.json({ message: 'API de scraping fonctionne !' });
    })
    .use('/chapters', chapters)
    .use('/auth', auth)
    .use('/library', library)
    .use('/client', client)
    .use('/notifications', notifications)
    .use('/tags', tags)
    .use('/stripe', stripeRoutes);

export default router;