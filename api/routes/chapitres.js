import { getChapters, getChaptersByLibrary } from '../utils/index.js';
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