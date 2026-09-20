import express from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../utils/database.js';
import { LOCALES } from '../utils/seoRoutes.js';

const router = express.Router();

// Catalogue public des partenaires : alimente les pages "sites supportés" et
// "partenaires officiels", jusqu'ici codées en dur dans le frontend.
router.get('/', async (req, res) => {
    const kind = req.query.kind ? String(req.query.kind) : null;
    const locale = LOCALES.includes(req.query.locale) ? req.query.locale : null;

    try {
        const partners = await sequelize.query(
            `SELECT name, kind, url, logo_url AS "logoUrl", description, locales,
                    is_highlighted AS "isHighlighted"
             FROM "Partner"
             WHERE is_active = true
               AND (:kind::text IS NULL OR kind = :kind)
               AND (:locale::text IS NULL OR locales IS NULL OR :locale = ANY(locales))
             ORDER BY is_highlighted DESC, name ASC`,
            { replacements: { kind, locale }, type: QueryTypes.SELECT }
        );

        res.json(partners);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des partenaires:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
