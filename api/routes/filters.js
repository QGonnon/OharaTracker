import express from 'express';
import {
    getSavedFilters,
    countSavedFilters,
    upsertSavedFilter,
    deleteSavedFilter,
} from '../utils/savedFilters.js';
import { authenticate } from '../utils/auth.js';
import { getPlanForUser, limitsFor, withinQuota } from '../utils/plan.js';

const router = express.Router();

const MAX_PAYLOAD_BYTES = 4000;

router.get('/', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const quota = limitsFor(plan).savedFilters;

        res.json({
            filters: await getSavedFilters(req.user.username),
            plan,
            quota: quota === Infinity ? null : quota,
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des filtres:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.post('/', authenticate, async (req, res) => {
    const label = String(req.body.label ?? '').trim();
    const { payload } = req.body;

    if (!label) return res.status(400).json({ message: 'Nom requis' });
    if (label.length > 40) return res.status(400).json({ message: 'Nom trop long (40 caractères maximum)' });
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return res.status(400).json({ message: 'Filtre invalide' });
    }
    if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
        return res.status(400).json({ message: 'Filtre trop volumineux' });
    }

    try {
        const plan = await getPlanForUser(req.user.username);
        const used = await countSavedFilters(req.user.username);

        if (!withinQuota(plan, 'savedFilters', used)) {
            const allowed = limitsFor(plan).savedFilters;
            return res.status(402).json({
                message: allowed === 0
                    ? 'Les filtres enregistrables sont inclus dans les offres Lite et Pro'
                    : `Votre offre ${plan} est limitée à ${allowed} filtre(s) enregistré(s)`,
                feature: 'savedFilters',
                plan,
            });
        }

        res.status(201).json(await upsertSavedFilter(req.user.username, { label, payload }));
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement du filtre:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Identifiant invalide' });

    try {
        if (!await deleteSavedFilter(req.user.username, id)) {
            return res.status(404).json({ message: 'Filtre introuvable' });
        }
        res.json({ message: 'Filtre supprimé' });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du filtre:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
