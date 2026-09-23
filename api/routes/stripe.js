import express from 'express';
import stripe from '../utils/stripe.js';
import { getBillingProfile, applyCheckoutSession } from '../utils/billing.js';
import { pageUrl } from '../utils/siteUrls.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

// Stripe renvoie le client sur ces URL après le paiement : elles doivent pointer
// vers des routes réelles du site, donc préfixées par la locale et traduites.
const returnTo = (key, req) => pageUrl(key, req.body?.locale);

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
            success_url: `${returnTo('pricing', req)}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnTo('pricing', req)}?checkout=cancel`,
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
            return_url: `${returnTo('pricing', req)}?checkout=success`,
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

// Confirme l'activation au retour du paiement, sans attendre le webhook.
//
// Le webhook reste la source de verite pour tout le cycle de vie de l'abonnement
// (renouvellement, changement de plan, resiliation). Mais faire dependre la
// PREMIERE activation de lui seul rend le service muet des qu'il ne passe pas :
// le client a paye et ne recoit rien, sans que personne ne s'en apercoive.
// Stripe recommande explicitement de verifier la session au retour en plus du
// webhook. Les deux chemins appellent la meme fonction et sont idempotents.
router.post('/confirm-session', authenticate, async (req, res) => {
    const sessionId = req.body?.sessionId;

    if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
        return res.status(400).json({ message: 'Identifiant de session invalide' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Sans ce controle, n'importe quel compte connecte pourrait s'attribuer
        // l'abonnement paye par quelqu'un d'autre en rejouant son identifiant de session.
        if (String(session.client_reference_id) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Cette session de paiement ne vous appartient pas' });
        }

        if (session.status !== 'complete' || session.payment_status !== 'paid') {
            return res.status(409).json({ message: 'Paiement non finalise', status: session.payment_status });
        }

        const plan = await applyCheckoutSession(session);

        if (!plan) {
            return res.status(422).json({ message: 'Session de paiement incomplete' });
        }

        res.json({ plan });
    } catch (error) {
        console.error('❌ Erreur lors de la confirmation de la session Stripe:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la confirmation du paiement' });
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
            return_url: returnTo('profile', req),
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('❌ Erreur lors de la création de la session du portail Stripe:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'accès au portail de facturation' });
    }
});

export default router;
