import express from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize, getClient, getClientPreferences, updateClientPreferences } from '../utils/database.js';
import { authenticate } from '../utils/auth.js';
import { getPlanForUser, limitsFor, requireFeature } from '../utils/plan.js';
import { THEMES, getAppearance, updateAppearance } from '../utils/appearance.js';
import { LOCALES } from '../utils/seoRoutes.js';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
    getClient(req.user.username, (err, client) => {
        if (err) {
            res.status(err.statusCode || 500).json({ error: err.message });
            return;
        }
        res.json(client);
    })
});

router.get('/preferences', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const preferences = await getClientPreferences(req.user.username);

        res.json({ ...preferences, plan, limits: limitsFor(plan) });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des préférences:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

router.patch('/preferences', authenticate, async (req, res) => {
    const { emailDigestEnabled, emailDigestDay, locale } = req.body;

    if (locale !== undefined && locale !== null && !LOCALES.includes(locale)) {
        return res.status(400).json({ message: 'Langue inconnue' });
    }

    if (emailDigestDay !== undefined) {
        if (!Number.isInteger(emailDigestDay) || emailDigestDay < 0 || emailDigestDay > 6) {
            return res.status(400).json({ message: 'Jour invalide (0 = dimanche, 6 = samedi)' });
        }

        const plan = await getPlanForUser(req.user.username);
        // Le rapport tombe le dimanche pour tout le monde ; seule l'offre Pro le déplace.
        if (emailDigestDay !== 0 && !limitsFor(plan).chooseDigestDay) {
            return res.status(402).json({
                message: 'Le choix du jour de réception est réservé à l\'offre Pro',
                feature: 'chooseDigestDay',
                plan,
            });
        }
    }

    try {
        const preferences = await updateClientPreferences(req.user.username, {
            emailDigestEnabled,
            emailDigestDay,
            locale,
        });

        res.json(preferences);
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des préférences:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

const DISCOVERY_TYPES = ['all', 'manga', 'anime'];
const MAX_PINNED_GENRES = 10;

router.get('/discovery', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const rows = await sequelize.query(
            'SELECT discovery_preferences AS preferences FROM "Client" WHERE name = :username',
            { replacements: { username: req.user.username }, type: QueryTypes.SELECT }
        );

        res.json({
            preferences: rows[0]?.preferences ?? null,
            plan,
            unlocked: limitsFor(plan).customDiscovery === true,
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la Découverte:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Personnalisation de la page Découverte, réservée à l'offre Pro.
router.patch('/discovery', authenticate, requireFeature('customDiscovery'), async (req, res) => {
    const { defaultType, pinnedGenres, hideTrending, hideSpotlight } = req.body ?? {};

    if (defaultType !== undefined && !DISCOVERY_TYPES.includes(defaultType)) {
        return res.status(400).json({ message: 'Type par défaut inconnu' });
    }
    if (pinnedGenres !== undefined) {
        if (!Array.isArray(pinnedGenres) || pinnedGenres.length > MAX_PINNED_GENRES) {
            return res.status(400).json({ message: `Au maximum ${MAX_PINNED_GENRES} genres épinglés` });
        }
        if (pinnedGenres.some(genre => typeof genre !== 'string' || genre.length > 40)) {
            return res.status(400).json({ message: 'Genre invalide' });
        }
    }

    const preferences = {
        defaultType: defaultType ?? 'all',
        pinnedGenres: pinnedGenres ?? [],
        hideTrending: hideTrending === true,
        hideSpotlight: hideSpotlight === true,
    };

    try {
        await sequelize.query(
            'UPDATE "Client" SET discovery_preferences = :preferences::jsonb WHERE name = :username',
            {
                replacements: { username: req.user.username, preferences: JSON.stringify(preferences) },
                type: QueryTypes.UPDATE,
            }
        );

        res.json({ preferences });
    } catch (error) {
        console.error('❌ Erreur lors de la personnalisation de la Découverte:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.get('/appearance', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const appearance = await getAppearance(req.user.username);

        res.json({
            ...appearance,
            plan,
            unlocked: limitsFor(plan).profileCustomization === true,
            themes: THEMES,
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'apparence:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

// Avatar animé, bannière et thèmes exclusifs sont vendus avec les offres payantes.
router.patch('/appearance', authenticate, requireFeature('profileCustomization'), async (req, res) => {
    try {
        res.json(await updateAppearance(req.user.username, req.body));
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'apparence:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

// Suppression définitive du compte. Le RGPD impose un droit d'effacement réel :
// on retire les données personnelles, pas seulement l'accès. Les œuvres du
// catalogue, elles, sont partagées et ne doivent évidemment pas disparaître.
router.delete('/', authenticate, async (req, res) => {
    const username = req.user.username;

    if (req.body?.confirm !== username) {
        return res.status(400).json({ message: 'Confirmation invalide : saisissez votre pseudo exact' });
    }

    const transaction = await sequelize.transaction();
    try {
        const scoped = [
            'DELETE FROM "Activity" WHERE name_client = :username',
            'DELETE FROM "Friendship" WHERE name_client = :username OR name_friend = :username',
            'DELETE FROM "WatchlistFollower" WHERE name_client = :username',
            'DELETE FROM "WatchlistItem" WHERE id_watchlist IN (SELECT id FROM "Watchlist" WHERE name_client = :username)',
            'DELETE FROM "WatchlistFollower" WHERE id_watchlist IN (SELECT id FROM "Watchlist" WHERE name_client = :username)',
            'DELETE FROM "Watchlist" WHERE name_client = :username',
            'DELETE FROM "ClientTagAssignment" WHERE id_client_tag IN (SELECT id FROM "ClientTag" WHERE name_client = :username)',
            'DELETE FROM "ClientTag" WHERE name_client = :username',
            'DELETE FROM "SavedFilter" WHERE name_client = :username',
            'DELETE FROM "Notification" WHERE name_client = :username',
            'DELETE FROM libraryusage WHERE name_client = :username',
            'DELETE FROM "ClientCategoryAssignment" WHERE name_client = :username',
            'DELETE FROM "PushSubscription" WHERE id_client = (SELECT id FROM "Client" WHERE name = :username)',
            'DELETE FROM "Client" WHERE name = :username',
        ];

        for (const statement of scoped) {
            await sequelize.query(statement, {
                replacements: { username },
                type: QueryTypes.DELETE,
                transaction,
            });
        }

        await transaction.commit();
        res.json({ message: 'Compte supprimé' });
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Erreur lors de la suppression du compte:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du compte' });
    }
});

export default router;
