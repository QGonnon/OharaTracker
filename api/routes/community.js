import express from 'express';
import {
    searchProfiles,
    getPublicProfile,
    listFriends,
    requestFriend,
    acceptFriend,
    removeFriend,
    getFriendFeed,
    setProfileVisibility,
    FEED_LIMIT,
} from '../utils/community.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

const USERNAME = /^[\w.-]{1,24}$/;

const fail = (res, error, context) => {
    console.error(`❌ ${context}:`, error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
};

router.get('/search', authenticate, async (req, res) => {
    try {
        res.json(await searchProfiles(req.query.q, req.user.username));
    } catch (error) {
        fail(res, error, 'Erreur lors de la recherche de profils');
    }
});

router.get('/feed', authenticate, async (req, res) => {
    try {
        const limit = Math.min(Number.parseInt(req.query.limit, 10) || FEED_LIMIT, FEED_LIMIT);
        res.json(await getFriendFeed(req.user.username, { limit }));
    } catch (error) {
        fail(res, error, 'Erreur lors de la récupération du fil d\'actualité');
    }
});

router.get('/friends', authenticate, async (req, res) => {
    try {
        res.json(await listFriends(req.user.username));
    } catch (error) {
        fail(res, error, 'Erreur lors de la récupération des amis');
    }
});

router.patch('/visibility', authenticate, async (req, res) => {
    if (typeof req.body.isPublic !== 'boolean') {
        return res.status(400).json({ message: 'isPublic booléen requis' });
    }

    try {
        res.json(await setProfileVisibility(req.user.username, req.body.isPublic));
    } catch (error) {
        fail(res, error, 'Erreur lors du changement de visibilité');
    }
});

router.get('/profile/:username', authenticate, async (req, res) => {
    if (!USERNAME.test(req.params.username)) return res.status(400).json({ message: 'Pseudo invalide' });

    try {
        res.json(await getPublicProfile(req.params.username, req.user.username));
    } catch (error) {
        fail(res, error, 'Erreur lors de la consultation du profil');
    }
});

router.post('/friends/:username', authenticate, async (req, res) => {
    if (!USERNAME.test(req.params.username)) return res.status(400).json({ message: 'Pseudo invalide' });

    try {
        const status = await requestFriend(req.user.username, req.params.username);
        res.json({ status });
    } catch (error) {
        fail(res, error, 'Erreur lors de la demande d\'ami');
    }
});

router.patch('/friends/:username', authenticate, async (req, res) => {
    if (!USERNAME.test(req.params.username)) return res.status(400).json({ message: 'Pseudo invalide' });

    try {
        await acceptFriend(req.user.username, req.params.username);
        res.json({ status: 'accepted' });
    } catch (error) {
        fail(res, error, 'Erreur lors de l\'acceptation de la demande');
    }
});

router.delete('/friends/:username', authenticate, async (req, res) => {
    if (!USERNAME.test(req.params.username)) return res.status(400).json({ message: 'Pseudo invalide' });

    try {
        await removeFriend(req.user.username, req.params.username);
        res.json({ message: 'Relation supprimée' });
    } catch (error) {
        fail(res, error, 'Erreur lors de la suppression de la relation');
    }
});

export default router;
