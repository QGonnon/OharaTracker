import express from 'express';
import chapters from './chapitres.js';
import auth from './auth.js';

const router = express.Router();

router
    .get('/', (req, res) => {
        res.json({ message: 'API de scraping fonctionne !' });
    })
    .use('/chapters', chapters)
    .use('/auth', auth);

export default router;