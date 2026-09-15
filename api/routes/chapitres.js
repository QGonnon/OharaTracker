import { getChapters, getChaptersByLibrary } from '../utils/index.js';
import { getCatalogLight, getWorkBySlug } from '../utils/catalog.js';
import express from 'express';

const router = express.Router()

router.get('/', (req, res) => {
    getChapters((err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    })
});

// Catalogue allégé : une entrée par œuvre, sans la liste des chapitres.
router.get('/light', async (_req, res) => {
    try {
        const rows = await getCatalogLight();
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/slug/:slug', async (req, res) => {
    try {
        const work = await getWorkBySlug(req.params.slug);
        if (!work) return res.status(404).json({ error: 'Oeuvre introuvable' });
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.json(work);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id_library', (req, res) => {
    const id_library = parseInt(req.params.id_library, 10);
    if (isNaN(id_library)) {
        return res.status(400).json({ error: 'id_library invalide' });
    }
    getChaptersByLibrary(id_library, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

export default router;
