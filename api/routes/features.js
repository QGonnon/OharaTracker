import express from 'express';
import { authenticate } from '../utils/auth.js';
import { getPlanForUser, limitsFor } from '../utils/plan.js';

const router = express.Router();

// Fonctionnalités livrées récemment et ouvertes d'abord aux offres payantes :
// c'est la traduction concrète de l'« accès anticipé » vendu avec Lite et Pro.
const BETA_FEATURES = [
    { key: 'customDiscovery', requires: 'customDiscovery' },
    { key: 'personalizedRecommendations', requires: 'personalizedRecommendations' },
    { key: 'advancedStats', requires: 'advancedStats' },
    { key: 'smartSuggestions', requires: 'smartSuggestions' },
];

router.get('/', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const limits = limitsFor(plan);

        res.json({
            plan,
            // `Infinity` n'existe pas en JSON : on l'expose comme `null` (illimité).
            limits: Object.fromEntries(
                Object.entries(limits).map(([key, value]) => [key, value === Infinity ? null : value])
            ),
            earlyAccess: limits.earlyAccess === true,
            beta: BETA_FEATURES.map(feature => ({
                key: feature.key,
                unlocked: limits[feature.requires] === true,
            })),
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des fonctionnalités:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
