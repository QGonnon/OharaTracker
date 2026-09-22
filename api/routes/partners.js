import express from 'express';
import { getActivePartners } from '../utils/partners.js';
import { LOCALES } from '../utils/seoRoutes.js';

const router = express.Router();

// Catalogue public des partenaires : alimente les pages "sites supportés" et
// "partenaires officiels", jusqu'ici codées en dur dans le frontend.
router.get('/', async (req, res) => {
    const kind = req.query.kind ? String(req.query.kind) : null;
    const locale = LOCALES.includes(req.query.locale) ? req.query.locale : null;

    try {
        res.json(await getActivePartners({ kind, locale }));
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des partenaires:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
