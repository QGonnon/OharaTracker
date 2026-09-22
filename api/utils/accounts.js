import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';
import { findActiveAffiliateCode } from './partners.js';

const FREE_SUBSCRIPTION_ID = 1;

// Le suffixe discriminant permet deux comptes de même pseudo (contrainte unique
// sur le couple name + code), à la manière des identifiants Discord.
const randomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

async function ensureFreeSubscription() {
    await sequelize.query(
        `INSERT INTO "Subscription" (id, name) VALUES (:id, 'Free') ON CONFLICT (id) DO NOTHING`,
        { replacements: { id: FREE_SUBSCRIPTION_ID }, type: QueryTypes.INSERT }
    );
}

async function findClientByNameOrEmail(username, email) {
    const rows = await sequelize.query(
        'SELECT name FROM "Client" WHERE name = :username OR email = :email LIMIT 1',
        { replacements: { username, email }, type: QueryTypes.SELECT }
    );
    return rows[0] ?? null;
}

async function createClient({ username, email, hashedPassword, referralCode }) {
    await ensureFreeSubscription();

    // Un code d'affiliation inconnu ne bloque pas l'inscription : il est ignoré.
    const referredBy = referralCode
        ? await findActiveAffiliateCode(String(referralCode).slice(0, 24))
        : null;

    await sequelize.query(
        `INSERT INTO "Client" (name, code, email, password, id_subscription, referred_by)
         VALUES (:username, :code, :email, :password, :idSubscription, :referredBy)`,
        {
            replacements: {
                username,
                code: randomCode(),
                email,
                password: hashedPassword,
                idSubscription: FREE_SUBSCRIPTION_ID,
                referredBy,
            },
            type: QueryTypes.INSERT,
        }
    );
}

async function findClientByEmail(email) {
    const rows = await sequelize.query(
        'SELECT id, name, code, email, password FROM "Client" WHERE email = :email LIMIT 1',
        { replacements: { email }, type: QueryTypes.SELECT }
    );
    return rows[0] ?? null;
}

async function findGoogleClientByEmail(email) {
    const rows = await sequelize.query(
        'SELECT id, name, code, email, google_id AS "googleId" FROM "Client" WHERE email = :email LIMIT 1',
        { replacements: { email }, type: QueryTypes.SELECT }
    );
    return rows[0] ?? null;
}

async function createGoogleClient({ name, email, googleId }) {
    await ensureFreeSubscription();

    await sequelize.query(
        `INSERT INTO "Client" (name, code, email, password, google_id, id_subscription)
         VALUES (:name, :code, :email, '', :googleId, :idSubscription)`,
        {
            replacements: { name, code: randomCode(), email, googleId, idSubscription: FREE_SUBSCRIPTION_ID },
            type: QueryTypes.INSERT,
        }
    );

    return findGoogleClientByEmail(email);
}

async function linkGoogleId(email, googleId) {
    await sequelize.query(
        'UPDATE "Client" SET google_id = :googleId WHERE email = :email',
        { replacements: { googleId, email }, type: QueryTypes.UPDATE }
    );
}

async function getAccountProfile(username) {
    const rows = await sequelize.query(
        `SELECT c.name, c.code, c.email, c.password, c.google_id AS "googleId",
                c.stripe_subscription_id AS "stripeSubscriptionId",
                s.name AS "subscriptionName"
         FROM "Client" c
         INNER JOIN "Subscription" s ON s.id = c.id_subscription
         WHERE c.name = :username LIMIT 1`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    return rows[0] ?? null;
}

async function findClientByName(username) {
    const rows = await sequelize.query(
        'SELECT id, name, code, email FROM "Client" WHERE name = :username LIMIT 1',
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    return rows[0] ?? null;
}

async function isUsernameTaken(username) {
    const rows = await sequelize.query(
        'SELECT name FROM "Client" WHERE name = :username LIMIT 1',
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    return rows.length > 0;
}

async function isEmailTakenByAnother(email, currentUsername) {
    const rows = await sequelize.query(
        'SELECT name FROM "Client" WHERE email = :email AND name != :currentUsername LIMIT 1',
        { replacements: { email, currentUsername }, type: QueryTypes.SELECT }
    );
    return rows.length > 0;
}

// Renommer un compte déplace la clé étrangère de toutes les tables qui référencent
// le pseudo. Les tables créées avec ON UPDATE CASCADE suivent d'elles-mêmes ;
// ClientCategoryAssignment, plus ancienne, doit être mise à jour explicitement.
async function renameClient({ currentUsername, newUsername, newEmail }) {
    const transaction = await sequelize.transaction();
    try {
        if (newUsername !== currentUsername) {
            await sequelize.query(
                'UPDATE "ClientCategoryAssignment" SET name_client = :newUsername WHERE name_client = :currentUsername',
                { replacements: { newUsername, currentUsername }, type: QueryTypes.UPDATE, transaction }
            );
        }

        await sequelize.query(
            'UPDATE "Client" SET name = :newUsername, email = :newEmail WHERE name = :currentUsername',
            { replacements: { newUsername, newEmail, currentUsername }, type: QueryTypes.UPDATE, transaction }
        );

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function getPasswordRecord(username) {
    const rows = await sequelize.query(
        'SELECT name, password, google_id AS "googleId" FROM "Client" WHERE name = :username LIMIT 1',
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    return rows[0] ?? null;
}

async function setPassword(username, hashedPassword) {
    await sequelize.query(
        'UPDATE "Client" SET password = :password WHERE name = :username',
        { replacements: { password: hashedPassword, username }, type: QueryTypes.UPDATE }
    );
}

export {
    findClientByNameOrEmail,
    createClient,
    findClientByEmail,
    findGoogleClientByEmail,
    createGoogleClient,
    linkGoogleId,
    getAccountProfile,
    findClientByName,
    isUsernameTaken,
    isEmailTakenByAnother,
    renameClient,
    getPasswordRecord,
    setPassword,
};
