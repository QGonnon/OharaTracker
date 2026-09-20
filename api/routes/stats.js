import express from 'express';
import { getBasicStats, getAdvancedStats } from '../utils/stats.js';
import { authenticate } from '../utils/auth.js';
import { getPlanForUser, limitsFor } from '../utils/plan.js';

const router = express.Router();

// Les compteurs de base sont ouverts à tous ; le détail suit l'offre, et seul Pro
// peut restreindre la période ou le type (les "filtres supplémentaires" du business plan).
router.get('/', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const limits = limitsFor(plan);
        const canFilter = limits.personalizedRecommendations === true;

        const type = canFilter && req.query.type ? String(req.query.type) : null;
        const since = canFilter && req.query.since ? new Date(String(req.query.since)) : null;

        if (since && Number.isNaN(since.getTime())) {
            return res.status(400).json({ message: 'Date invalide' });
        }

        const basic = await getBasicStats(req.user.username, { type, since });
        const advanced = limits.advancedStats
            ? await getAdvancedStats(req.user.username, { since: since ? since.toISOString() : null })
            : null;

        res.json({ plan, advancedUnlocked: limits.advancedStats === true, filtersUnlocked: canFilter, ...basic, advanced });
    } catch (error) {
        console.error('❌ Erreur lors du calcul des statistiques:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

export default router;
