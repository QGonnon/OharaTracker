import { getLastChapters } from '../utils/index.js';
import express from 'express';

const router = express.Router()

router.get('/', (req, res) => {
    getLastChapters((err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ latest_chapters: rows });
    })
});

export default router;