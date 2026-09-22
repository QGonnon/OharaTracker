import stripe from '../utils/stripe.js';
import {
    getSubscriptionIdByName,
    setClientSubscription,
    downgradeBySubscriptionId,
    setPlanBySubscriptionId,
} from '../utils/billing.js';

const PLAN_SUBSCRIPTION_NAMES = {
    lite: 'Lite',
    pro: 'Pro',
};
const FREE_SUBSCRIPTION_NAME = 'Free';

const PLAN_BY_PRICE_ID = {
    [process.env.STRIPE_PRICE_ID_LITE]: 'lite',
    [process.env.STRIPE_PRICE_ID_PRO]: 'pro',
};

export default async function stripeWebhookHandler(req, res) {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('❌ Signature webhook Stripe invalide:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const clientId = Number(session.client_reference_id);
                const plan = session.metadata?.plan;
                const subscriptionName = PLAN_SUBSCRIPTION_NAMES[plan];

                if (clientId && subscriptionName) {
                    const idSubscription = await getSubscriptionIdByName(subscriptionName);
                    await setClientSubscription(clientId, {
                        subscriptionId: session.subscription,
                        customerId: session.customer,
                        idSubscription,
                    });
                } else {
                    console.error('❌ Webhook checkout.session.completed: plan ou client introuvable', { clientId, plan });
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const isActive = ['active', 'trialing'].includes(subscription.status);
                const priceId = subscription.items?.data?.[0]?.price?.id;
                const plan = PLAN_BY_PRICE_ID[priceId];
                const subscriptionName = isActive
                    ? (PLAN_SUBSCRIPTION_NAMES[plan] || FREE_SUBSCRIPTION_NAME)
                    : FREE_SUBSCRIPTION_NAME;
                const idSubscription = await getSubscriptionIdByName(subscriptionName);

                await setPlanBySubscriptionId(subscription.id, idSubscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await downgradeBySubscriptionId(
                    subscription.id,
                    await getSubscriptionIdByName(FREE_SUBSCRIPTION_NAME)
                );
                break;
            }

            default:
                break;
        }

        res.json({ received: true });
    } catch (error) {
        console.error('❌ Erreur lors du traitement du webhook Stripe:', error);
        res.status(500).json({ message: 'Erreur serveur lors du traitement du webhook' });
    }
}
