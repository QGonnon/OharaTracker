import express from 'express';
import { authenticate } from '../utils/auth.js';
import { getPlanForUser, limitsFor } from '../utils/plan.js';

const router = express.Router();

// Fonctionnalités réellement en avant-première, c'est-à-dire livrées mais pas
// encore ouvertes à tout le monde. La liste est VIDE tant qu'aucune n'est dans
// ce cas : y faire figurer des fonctionnalités déjà disponibles pour tous
// mentirait à l'utilisateur sur ce que son abonnement lui apporte.
const BETA_FEATURES = [];

// Ce que l'offre inclut, dans l'ordre où on veut le présenter. `quota` pointe
// vers une limite chiffrée, `flag` vers un accès tout-ou-rien.
const PLAN_CONTENT = [
    { key: 'customTags', quota: 'customTags' },
    { key: 'livePushFollows', quota: 'livePushFollows' },
    { key: 'ownedLists', quota: 'ownedLists' },
    { key: 'followedLists', quota: 'followedLists' },
    { key: 'savedFilters', quota: 'savedFilters' },
    { key: 'smartSuggestions', flag: 'smartSuggestions' },
    { key: 'advancedStats', flag: 'advancedStats' },
    { key: 'profileCustomization', flag: 'profileCustomization' },
    { key: 'personalizedRecommendations', flag: 'personalizedRecommendations' },
    { key: 'customDiscovery', flag: 'customDiscovery' },
    { key: 'advancedStatsFilters', flag: 'advancedStatsFilters' },
    { key: 'chooseDigestDay', flag: 'chooseDigestDay' },
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
            content: PLAN_CONTENT.map(entry => {
                const raw = entry.quota ? limits[entry.quota] : limits[entry.flag];
                return {
                    key: entry.key,
                    kind: entry.quota ? 'quota' : 'flag',
                    // null = illimité pour un quota, true/false pour un accès
                    value: raw === Infinity ? null : raw,
                    included: entry.quota ? raw > 0 : raw === true,
                };
            }),
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
