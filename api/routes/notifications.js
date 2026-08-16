import express from 'express';
import {
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    savePushSubscription,
    removePushSubscriptionForClient,
} from '../utils/database.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
    const { unreadOnly, limit } = req.query;

    try {
        const rows = await getUserNotifications(req.user.username, {
            unreadOnly: unreadOnly === 'true',
            limit: limit ? parseInt(limit, 10) : undefined,
        });
        res.json(rows);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const count = await getUnreadNotificationCount(req.user.username);
        res.json({ count });
    } catch (error) {
        console.error('❌ Erreur lors du comptage des notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.patch('/read-all', authenticate, async (req, res) => {
    try {
        await markAllNotificationsRead(req.user.username);
        res.json({ message: 'Notifications marquées comme lues' });
    } catch (error) {
        console.error('❌ Erreur lors du marquage des notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.patch('/:id/read', authenticate, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    try {
        await markNotificationRead(id, req.user.username);
        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Identifiant invalide' });
    }

    try {
        await deleteNotification(id, req.user.username);
        res.json({ message: 'Notification supprimée' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

router.post('/subscribe', authenticate, async (req, res) => {
    const { endpoint, keys } = req.body;

    try {
        await savePushSubscription(req.user.username, { endpoint, keys });
        res.status(201).json({ message: 'Abonnement push enregistré' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

router.delete('/subscribe', authenticate, async (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json({ message: 'endpoint requis' });
    }

    try {
        await removePushSubscriptionForClient(req.user.username, endpoint);
        res.json({ message: 'Abonnement push supprimé' });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression de l\'abonnement push:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
