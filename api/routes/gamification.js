import express from 'express';
import { getBadges } from '../utils/badges.js';
import { getWorksLeaderboard, getFriendsLeaderboard } from '../utils/leaderboards.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

router.get('/badges', authenticate, async (req, res) => {
    try {
        res.json(await getBadges(req.user.username));
    } catch (error) {
        console.error('❌ Erreur lors du calcul des badges:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.get('/leaderboard/works', async (_req, res) => {
    try {
        res.json(await getWorksLeaderboard());
    } catch (error) {
        console.error('❌ Erreur lors du classement des œuvres:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.get('/leaderboard/friends', authenticate, async (req, res) => {
    try {
        res.json(await getFriendsLeaderboard(req.user.username));
    } catch (error) {
        console.error('❌ Erreur lors du classement entre amis:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
