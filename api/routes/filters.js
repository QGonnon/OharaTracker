import express from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../utils/database.js';
import { authenticate } from '../utils/auth.js';
import { getPlanForUser, limitsFor, withinQuota } from '../utils/plan.js';

const router = express.Router();

const MAX_PAYLOAD_BYTES = 4000;

router.get('/', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const quota = limitsFor(plan).savedFilters;

        const filters = await sequelize.query(
            `SELECT id, label, payload FROM "SavedFilter"
             WHERE name_client = :username ORDER BY created_at ASC`,
            { replacements: { username: req.user.username }, type: QueryTypes.SELECT }
        );

        res.json({ filters, plan, quota: quota === Infinity ? null : quota });
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
        const [{ count }] = await sequelize.query(
            'SELECT COUNT(*)::int AS count FROM "SavedFilter" WHERE name_client = :username',
            { replacements: { username: req.user.username }, type: QueryTypes.SELECT }
        );

        if (!withinQuota(plan, 'savedFilters', count)) {
            const allowed = limitsFor(plan).savedFilters;
            return res.status(402).json({
                message: allowed === 0
                    ? 'Les filtres enregistrables sont inclus dans les offres Lite et Pro'
                    : `Votre offre ${plan} est limitée à ${allowed} filtre(s) enregistré(s)`,
                feature: 'savedFilters',
                plan,
            });
        }

        // Réenregistrer sous un nom existant écrase le filtre : c'est le geste attendu.
        const [rows] = await sequelize.query(
            `INSERT INTO "SavedFilter" (name_client, label, payload, created_at)
             VALUES (:username, :label, :payload::jsonb, NOW())
             ON CONFLICT ON CONSTRAINT saved_filter_unique_label_per_client
             DO UPDATE SET payload = EXCLUDED.payload
             RETURNING id, label, payload`,
            {
                replacements: { username: req.user.username, label, payload: JSON.stringify(payload) },
                type: QueryTypes.INSERT,
            }
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement du filtre:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Identifiant invalide' });

    try {
        const deleted = await sequelize.query(
            'DELETE FROM "SavedFilter" WHERE id = :id AND name_client = :username RETURNING id',
            { replacements: { id, username: req.user.username }, type: QueryTypes.DELETE }
        );

        if (!deleted?.length) return res.status(404).json({ message: 'Filtre introuvable' });
        res.json({ message: 'Filtre supprimé' });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du filtre:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
