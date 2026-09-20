import express from 'express';
import {
    getOwnedWatchlists,
    getFollowedWatchlists,
    countOwnedWatchlists,
    countFollowedWatchlists,
    createWatchlist,
    deleteWatchlist,
    setWatchlistSharing,
    addWorkToWatchlist,
    removeWorkFromWatchlist,
    getWatchlistByToken,
    followWatchlistByToken,
    unfollowWatchlist,
} from '../utils/watchlists.js';
import { authenticate } from '../utils/auth.js';
import { getPlanForUser, limitsFor, withinQuota } from '../utils/plan.js';

const router = express.Router();

const parseId = value => {
    const id = Number.parseInt(value, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const fail = (res, error, context) => {
    console.error(`❌ ${context}:`, error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
};

const quotaMessage = (plan, feature, label) => ({
    message: `Votre offre ${plan} est limitée à ${limitsFor(plan)[feature]} ${label}`,
    feature,
    plan,
});

router.get('/', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const limits = limitsFor(plan);

        res.json({
            owned: await getOwnedWatchlists(req.user.username),
            followed: await getFollowedWatchlists(req.user.username),
            plan,
            quotas: {
                owned: limits.ownedLists === Infinity ? null : limits.ownedLists,
                followed: limits.followedLists === Infinity ? null : limits.followedLists,
            },
        });
    } catch (error) {
        fail(res, error, 'Erreur lors de la récupération des listes');
    }
});

router.post('/', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const used = await countOwnedWatchlists(req.user.username);

        if (!withinQuota(plan, 'ownedLists', used)) {
            return res.status(402).json(quotaMessage(plan, 'ownedLists', 'liste(s) créée(s)'));
        }

        res.status(201).json(await createWatchlist(req.user.username, req.body));
    } catch (error) {
        fail(res, error, 'Erreur lors de la création de la liste');
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Identifiant invalide' });

    try {
        await deleteWatchlist(req.user.username, id);
        res.json({ message: 'Liste supprimée' });
    } catch (error) {
        fail(res, error, 'Erreur lors de la suppression de la liste');
    }
});

router.patch('/:id/sharing', authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Identifiant invalide' });
    if (typeof req.body.isPublic !== 'boolean') {
        return res.status(400).json({ message: 'isPublic booléen requis' });
    }

    try {
        res.json(await setWatchlistSharing(req.user.username, id, req.body.isPublic));
    } catch (error) {
        fail(res, error, 'Erreur lors du partage de la liste');
    }
});

router.put('/:id/works/:idLibrary', authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    const idLibrary = parseId(req.params.idLibrary);
    if (!id || !idLibrary) return res.status(400).json({ message: 'Identifiants invalides' });

    try {
        await addWorkToWatchlist(req.user.username, id, idLibrary);
        res.json({ message: 'Œuvre ajoutée à la liste' });
    } catch (error) {
        fail(res, error, 'Erreur lors de l\'ajout à la liste');
    }
});

router.delete('/:id/works/:idLibrary', authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    const idLibrary = parseId(req.params.idLibrary);
    if (!id || !idLibrary) return res.status(400).json({ message: 'Identifiants invalides' });

    try {
        await removeWorkFromWatchlist(req.user.username, id, idLibrary);
        res.json({ message: 'Œuvre retirée de la liste' });
    } catch (error) {
        fail(res, error, 'Erreur lors du retrait de la liste');
    }
});

// Consultation publique : pas d'authentification, le jeton fait foi.
router.get('/shared/:token', async (req, res) => {
    try {
        res.json(await getWatchlistByToken(String(req.params.token)));
    } catch (error) {
        fail(res, error, 'Erreur lors de la consultation de la liste partagée');
    }
});

router.post('/shared/:token/follow', authenticate, async (req, res) => {
    try {
        const plan = await getPlanForUser(req.user.username);
        const used = await countFollowedWatchlists(req.user.username);

        if (!withinQuota(plan, 'followedLists', used)) {
            return res.status(402).json(quotaMessage(plan, 'followedLists', 'liste(s) suivie(s)'));
        }

        res.json(await followWatchlistByToken(req.user.username, String(req.params.token)));
    } catch (error) {
        fail(res, error, 'Erreur lors du suivi de la liste');
    }
});

router.delete('/:id/follow', authenticate, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Identifiant invalide' });

    try {
        await unfollowWatchlist(req.user.username, id);
        res.json({ message: 'Liste retirée de vos suivis' });
    } catch (error) {
        fail(res, error, 'Erreur lors du retrait de la liste');
    }
});

export default router;
