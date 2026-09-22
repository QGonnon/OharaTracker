import express from 'express';
import { getClient, getClientPreferences, updateClientPreferences } from '../utils/database.js';
import { getDiscoveryPreferences, updateDiscoveryPreferences } from '../utils/discovery.js';
import { deleteAccount } from '../utils/accountDeletion.js';
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

router.get('/discovery', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);

        res.json({
            preferences: await getDiscoveryPreferences(req.user.username),
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
    try {
        res.json({ preferences: await updateDiscoveryPreferences(req.user.username, req.body ?? {}) });
    } catch (error) {
        console.error('❌ Erreur lors de la personnalisation de la Découverte:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
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

// Suppression définitive du compte, confirmée par la saisie du pseudo exact.
router.delete('/', authenticate, async (req, res) => {
    const username = req.user.username;

    if (req.body?.confirm !== username) {
        return res.status(400).json({ message: 'Confirmation invalide : saisissez votre pseudo exact' });
    }

    try {
        await deleteAccount(username);
        res.json({ message: 'Compte supprimé' });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du compte:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du compte' });
    }
});

export default router;
