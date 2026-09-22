import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

// Accès aux données de facturation. Les identifiants Stripe vivent sur `Client`
// et ne sont jamais exposés au frontend : seules les URL de session le sont.

async function getBillingProfile(clientId) {
    const rows = await sequelize.query(
        `SELECT id, email,
                stripe_customer_id     AS "stripeCustomerId",
                stripe_subscription_id AS "stripeSubscriptionId"
         FROM "Client" WHERE id = :clientId LIMIT 1`,
        { replacements: { clientId }, type: QueryTypes.SELECT }
    );
    return rows[0] ?? null;
}

const subscriptionIdCache = new Map();

async function getSubscriptionIdByName(name) {
    if (subscriptionIdCache.has(name)) return subscriptionIdCache.get(name);

    const rows = await sequelize.query(
        'SELECT id FROM "Subscription" WHERE name = :name LIMIT 1',
        { replacements: { name }, type: QueryTypes.SELECT }
    );
    if (rows.length === 0) throw new Error(`Plan d'abonnement "${name}" introuvable en base`);

    subscriptionIdCache.set(name, rows[0].id);
    return rows[0].id;
}

async function setClientSubscription(clientId, { subscriptionId, customerId, idSubscription }) {
    await sequelize.query(
        `UPDATE "Client"
         SET id_subscription = :idSubscription,
             stripe_customer_id = COALESCE(:customerId, stripe_customer_id),
             stripe_subscription_id = :subscriptionId
         WHERE id = :clientId`,
        {
            replacements: {
                clientId,
                idSubscription,
                customerId: customerId || null,
                subscriptionId: subscriptionId || null,
            },
            type: QueryTypes.UPDATE,
        }
    );
}

async function downgradeBySubscriptionId(stripeSubscriptionId, freeSubscriptionId) {
    await sequelize.query(
        `UPDATE "Client"
         SET id_subscription = :freeId, stripe_subscription_id = NULL
         WHERE stripe_subscription_id = :stripeSubscriptionId`,
        {
            replacements: { freeId: freeSubscriptionId, stripeSubscriptionId },
            type: QueryTypes.UPDATE,
        }
    );
}

async function findClientIdByCustomerId(customerId) {
    const rows = await sequelize.query(
        'SELECT id FROM "Client" WHERE stripe_customer_id = :customerId LIMIT 1',
        { replacements: { customerId }, type: QueryTypes.SELECT }
    );
    return rows[0]?.id ?? null;
}

export {
    getBillingProfile,
    getSubscriptionIdByName,
    setClientSubscription,
    downgradeBySubscriptionId,
    findClientIdByCustomerId,
};

// Applique un plan à partir de l'identifiant d'abonnement Stripe (webhook
// customer.subscription.updated : on ne connaît que l'abonnement, pas le client).
async function setPlanBySubscriptionId(stripeSubscriptionId, idSubscription) {
    await sequelize.query(
        `UPDATE "Client" SET id_subscription = :idSubscription
         WHERE stripe_subscription_id = :stripeSubscriptionId`,
        { replacements: { idSubscription, stripeSubscriptionId }, type: QueryTypes.UPDATE }
    );
}

export { setPlanBySubscriptionId };
