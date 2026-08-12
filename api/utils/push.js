import webpush from 'web-push';
import dotenv from 'dotenv';
import { getPushSubscriptionsForUsers, removePushSubscription } from './database.js';

dotenv.config();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@ohara.local';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
    console.warn('⚠️  VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY manquantes: les notifications push sont désactivées.');
}

// Envoie une notification push à tous les abonnements des utilisateurs donnés.
// Purge automatiquement les abonnements périmés (410/404).
async function sendPushToUsers(usernames, payload) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !usernames?.length) {
        return;
    }

    const subscriptions = await getPushSubscriptionsForUsers(usernames);
    const body = JSON.stringify(payload);

    await Promise.all(subscriptions.map(async sub => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
        };

        try {
            await webpush.sendNotification(pushSubscription, body);
        } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
                await removePushSubscription(sub.endpoint);
            } else {
                console.error('❌ Erreur envoi push:', err.message);
            }
        }
    }));
}

export { sendPushToUsers };
