import express from 'express';
import stripe from '../utils/stripe.js';
import { getBillingProfile } from '../utils/billing.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();
const FRONTEND_URL = `${process.env.SITE_URL}`;

const PLAN_PRICE_IDS = {
    lite: process.env.STRIPE_PRICE_ID_LITE,
    pro: process.env.STRIPE_PRICE_ID_PRO,
};

router.post('/create-checkout-session', authenticate, async (req, res) => {
    try {
        const plan = req.body?.plan;
        const priceId = PLAN_PRICE_IDS[plan];

        if (!priceId) {
            return res.status(400).json({ message: 'Plan invalide' });
        }

        const client = await getBillingProfile(req.user.id);

        if (!client) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            customer: client.stripeCustomerId || undefined,
            customer_email: client.stripeCustomerId ? undefined : client.email,
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

        const client = await getBillingProfile(req.user.id);

        if (!client?.stripeCustomerId || !client?.stripeSubscriptionId) {
            return res.status(400).json({ message: 'Aucun abonnement actif à modifier' });
        }

        const { stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId } = client;
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
        const client = await getBillingProfile(req.user.id);

        if (!client?.stripeCustomerId) {
            return res.status(400).json({ message: 'Aucun abonnement Stripe associé à ce compte' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: client.stripeCustomerId,
            return_url: `${FRONTEND_URL}/profile`,
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('❌ Erreur lors de la création de la session du portail Stripe:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'accès au portail de facturation' });
    }
});

export default router;
