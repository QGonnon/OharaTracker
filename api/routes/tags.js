import express from 'express';
import {
    getClientTags,
    countClientTags,
    createClientTag,
    deleteClientTag,
    assignClientTag,
    unassignClientTag,
} from '../utils/clientTags.js';
import { authenticate } from '../utils/auth.js';
import { getPlanForUser, limitsFor, withinQuota } from '../utils/plan.js';

const router = express.Router();

const parseId = value => {
    const id = Number.parseInt(value, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const fail = (res, error, fallback) => {
    console.error(`❌ ${fallback}:`, error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
};

router.get('/', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const tags = await getClientTags(req.user.username);
        const quota = limitsFor(plan).customTags;

        res.json({ tags, plan, quota: quota === Infinity ? null : quota });
    } catch (error) {
        fail(res, error, 'Erreur lors de la récupération des tags');
    }
});

router.post('/', authenticate, async (req, res) => {
    const { label, color } = req.body;

    try {
        const plan = await getPlanForUser(req.user.username);
        const used = await countClientTags(req.user.username);

        if (!withinQuota(plan, 'customTags', used)) {
            return res.status(402).json({
                message: `Votre offre ${plan} est limitée à ${limitsFor(plan).customTags} tag(s) personnalisé(s)`,
                feature: 'customTags',
                plan,
            });
        }

        res.status(201).json(await createClientTag(req.user.username, { label, color }));
    } catch (error) {
        fail(res, error, 'Erreur lors de la création du tag');
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Identifiant de tag invalide' });

    try {
        await deleteClientTag(req.user.username, id);
        res.json({ message: 'Tag supprimé' });
    } catch (error) {
        fail(res, error, 'Erreur lors de la suppression du tag');
    }
});

router.put('/:id/works/:idLibrary', authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    const idLibrary = parseId(req.params.idLibrary);
    if (!id || !idLibrary) return res.status(400).json({ message: 'Identifiants invalides' });

    try {
        await assignClientTag(req.user.username, id, idLibrary);
        res.json({ message: 'Tag appliqué' });
    } catch (error) {
        fail(res, error, 'Erreur lors de l\'application du tag');
    }
});

router.delete('/:id/works/:idLibrary', authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    const idLibrary = parseId(req.params.idLibrary);
    if (!id || !idLibrary) return res.status(400).json({ message: 'Identifiants invalides' });

    try {
        await unassignClientTag(req.user.username, id, idLibrary);
        res.json({ message: 'Tag retiré' });
    } catch (error) {
        fail(res, error, 'Erreur lors du retrait du tag');
    }
});

export default router;
