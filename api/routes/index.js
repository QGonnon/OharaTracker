import express from 'express';
import chapters from './chapitres.js'

const router = express.Router()

router
    .get('/', (req, res) => {
        res.json({ message: 'API de scraping fonctionne !' });
    })
    .use('/chapters', chapters)

export default router;