import express from 'express';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../utils/database.js';
import stripe from '../utils/stripe.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = `${process.env.APP_URL}:${process.env.APP_PORT}`;

const PLAN_PRICE_IDS = {
    lite: process.env.STRIPE_PRICE_ID_LITE,
    pro: process.env.STRIPE_PRICE_ID_PRO,
};

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
}

router.post('/create-checkout-session', authenticate, async (req, res) => {
    try {
        const plan = req.body?.plan;
        const priceId = PLAN_PRICE_IDS[plan];

        if (!priceId) {
            return res.status(400).json({ message: 'Plan invalide' });
        }

        const clients = await sequelize.query(
            'SELECT id, email, stripe_customer_id FROM "Client" WHERE id = :id LIMIT 1',
            { replacements: { id: req.user.id }, type: QueryTypes.SELECT }
        );

        if (clients.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const client = clients[0];

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            customer: client.stripe_customer_id || undefined,
            customer_email: client.stripe_customer_id ? undefined : client.email,
            client_reference_id: String(client.id),
            metadata: { plan },
            success_url: `${FRONTEND_URL}/pricing?checkout=success`,
            cancel_url: `${FRONTEND_URL}/pricing?checkout=cancel`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('❌ Erreur lors de la création de la session Stripe:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création du paiement' });
    }
});

// Bascule l'abonnement en cours vers un autre plan (upgrade ou downgrade) via le portail Stripe,
// avec proration automatique. Ne crée pas un second abonnement, contrairement à create-checkout-session.
router.post('/create-plan-change-session', authenticate, async (req, res) => {
    try {
        const plan = req.body?.plan;
        const priceId = PLAN_PRICE_IDS[plan];

        if (!priceId) {
            return res.status(400).json({ message: 'Plan invalide' });
        }

        const clients = await sequelize.query(
            'SELECT stripe_customer_id, stripe_subscription_id FROM "Client" WHERE id = :id LIMIT 1',
            { replacements: { id: req.user.id }, type: QueryTypes.SELECT }
        );

        if (clients.length === 0 || !clients[0].stripe_customer_id || !clients[0].stripe_subscription_id) {
            return res.status(400).json({ message: 'Aucun abonnement actif à modifier' });
        }

        const { stripe_customer_id: customerId, stripe_subscription_id: subscriptionId } = clients[0];
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const itemId = subscription.items.data[0].id;

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${FRONTEND_URL}/pricing?checkout=success`,
            flow_data: {
                type: 'subscription_update_confirm',
                subscription_update_confirm: {
                    subscription: subscriptionId,
                    items: [{ id: itemId, price: priceId, quantity: 1 }],
                },
            },
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('❌ Erreur lors de la création de la session de changement de plan Stripe:', error);
        res.status(500).json({ message: 'Erreur serveur lors du changement de plan' });
    }
});

router.post('/create-portal-session', authenticate, async (req, res) => {
    try {
        const clients = await sequelize.query(
            'SELECT stripe_customer_id FROM "Client" WHERE id = :id LIMIT 1',
            { replacements: { id: req.user.id }, type: QueryTypes.SELECT }
        );

        if (clients.length === 0 || !clients[0].stripe_customer_id) {
            return res.status(400).json({ message: 'Aucun abonnement Stripe associé à ce compte' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: clients[0].stripe_customer_id,
            return_url: `${FRONTEND_URL}/profile`,
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('❌ Erreur lors de la création de la session du portail Stripe:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'accès au portail de facturation' });
    }
});

export default router;
