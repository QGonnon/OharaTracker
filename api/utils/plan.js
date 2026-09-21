import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

const FREE = 'Free';

// Grille des offres du business plan. `Infinity` = illimité, `false` = réservé
// à une offre supérieure. C'est la seule source de vérité des limites : les
// routes ne codent aucun seuil en dur.
const PLAN_LIMITS = {
    Free: {
        customTags: 1,
        livePushFollows: 1,
        followedLists: 1,
        ownedLists: 0,
        savedFilters: 0,
        chooseDigestDay: false,
        smartSuggestions: false,
        advancedStats: false,
        advancedStatsFilters: false,
        profileCustomization: false,
        personalizedRecommendations: false,
        customDiscovery: false,
        earlyAccess: false,
    },
    Lite: {
        customTags: 10,
        livePushFollows: 10,
        followedLists: Infinity,
        ownedLists: 1,
        savedFilters: 1,
        chooseDigestDay: false,
        smartSuggestions: true,
        advancedStats: true,
        advancedStatsFilters: false,
        profileCustomization: true,
        personalizedRecommendations: false,
        customDiscovery: false,
        earlyAccess: true,
    },
    Pro: {
        customTags: Infinity,
        livePushFollows: Infinity,
        followedLists: Infinity,
        ownedLists: Infinity,
        savedFilters: Infinity,
        chooseDigestDay: true,
        smartSuggestions: true,
        advancedStats: true,
        advancedStatsFilters: true,
        profileCustomization: true,
        personalizedRecommendations: true,
        customDiscovery: true,
        earlyAccess: true,
    },
};

const limitsFor = plan => PLAN_LIMITS[plan] ?? PLAN_LIMITS[FREE];

async function getPlanForUser(username) {
    const rows = await sequelize.query(
        `SELECT s.name AS plan
         FROM "Client" c
         INNER JOIN "Subscription" s ON s.id = c.id_subscription
         WHERE c.name = :username`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    return rows[0]?.plan ?? FREE;
}

const allows = (plan, feature) => limitsFor(plan)[feature] === true;

// Vérifie qu'un ajout reste sous le quota de l'offre ; `current` est le nombre déjà utilisé.
const withinQuota = (plan, feature, current) => current < limitsFor(plan)[feature];

// Refuse la requête avec 402 (paiement requis) si l'offre ne couvre pas la fonctionnalité.
function requireFeature(feature) {
    return async (req, res, next) => {
        const plan = await getPlanForUser(req.user.username);
        if (!allows(plan, feature)) {
            return res.status(402).json({ message: 'Fonctionnalité réservée à une offre supérieure', feature, plan });
        }
        req.plan = plan;
        next();
    };
}

export { PLAN_LIMITS, FREE, limitsFor, getPlanForUser, allows, withinQuota, requireFeature };
