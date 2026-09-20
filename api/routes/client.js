import express from 'express';
import { getClient, getClientPreferences, updateClientPreferences } from '../utils/database.js';
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

export default router;
