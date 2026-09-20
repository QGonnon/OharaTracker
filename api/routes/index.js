import express from 'express';
import chapters from './chapitres.js';
import auth from './auth.js';
import library from './library.js';
import client from './client.js';
import notifications from './notifications.js';
import stripeRoutes from './stripe.js';
import tags from './tags.js';
import stats from './stats.js';
import watchlists from './watchlists.js';
import suggestions from './suggestions.js';
import filters from './filters.js';
import community from './community.js';
import partners from './partners.js';
import gamification from './gamification.js';


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
    .use('/stats', stats)
    .use('/watchlists', watchlists)
    .use('/suggestions', suggestions)
    .use('/filters', filters)
    .use('/community', community)
    .use('/partners', partners)
    .use('/', gamification)
    .use('/stripe', stripeRoutes);

export default router;