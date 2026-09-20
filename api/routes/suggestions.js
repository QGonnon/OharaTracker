import express from 'express';
import { getRecommendations, getPopularWorks } from '../utils/recommendations.js';
import { authenticate } from '../utils/auth.js';
import { getPlanForUser, limitsFor } from '../utils/plan.js';

const router = express.Router();

const MAX_LIMIT = 24;

router.get('/', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const limits = limitsFor(plan);

        if (!limits.smartSuggestions) {
            return res.status(402).json({
                message: 'Les suggestions intelligentes sont incluses dans les offres Lite et Pro',
                feature: 'smartSuggestions',
                plan,
            });
        }

        const limit = Math.min(Number.parseInt(req.query.limit, 10) || 12, MAX_LIMIT);
        const kind = req.query.type ? String(req.query.type) : null;
        // L'offre Pro pondère par les notes et l'état de lecture ; les autres comptent les genres.
        const mode = limits.personalizedRecommendations ? 'weighted' : 'simple';

        let items = await getRecommendations(req.user.username, { mode, limit, kind });
        let fallback = false;

        // Bibliothèque vide ou genres inconnus : mieux vaut le catalogue populaire qu'une page vide.
        if (items.length === 0) {
            items = await getPopularWorks({ limit });
            fallback = true;
        }

        res.json({ items, mode, fallback, plan });
    } catch (error) {
        console.error('❌ Erreur lors du calcul des suggestions:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

export default router;
