import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

// Droit d'effacement du RGPD : on retire les données personnelles, pas seulement
// l'accès. Les œuvres du catalogue sont partagées et ne doivent pas disparaître.
// L'ordre suit les dépendances : les liaisons avant les entités qu'elles pointent.
const DELETION_STATEMENTS = [
    'DELETE FROM "Activity" WHERE name_client = :username',
    'DELETE FROM "Friendship" WHERE name_client = :username OR name_friend = :username',
    'DELETE FROM "WatchlistFollower" WHERE name_client = :username',
    'DELETE FROM "WatchlistItem" WHERE id_watchlist IN (SELECT id FROM "Watchlist" WHERE name_client = :username)',
    'DELETE FROM "WatchlistFollower" WHERE id_watchlist IN (SELECT id FROM "Watchlist" WHERE name_client = :username)',
    'DELETE FROM "Watchlist" WHERE name_client = :username',
    'DELETE FROM "ClientTagAssignment" WHERE id_client_tag IN (SELECT id FROM "ClientTag" WHERE name_client = :username)',
    'DELETE FROM "ClientTag" WHERE name_client = :username',
    'DELETE FROM "SavedFilter" WHERE name_client = :username',
    'DELETE FROM "Notification" WHERE name_client = :username',
    'DELETE FROM libraryusage WHERE name_client = :username',
    'DELETE FROM "ClientCategoryAssignment" WHERE name_client = :username',
    'DELETE FROM "PushSubscription" WHERE id_client = (SELECT id FROM "Client" WHERE name = :username)',
    'DELETE FROM "Client" WHERE name = :username',
];

// Tout ou rien : un effacement partiel laisserait des données orphelines
// rattachées à un compte qui n'existe plus.
async function deleteAccount(username) {
    const transaction = await sequelize.transaction();
    try {
        for (const statement of DELETION_STATEMENTS) {
            await sequelize.query(statement, {
                replacements: { username },
                type: QueryTypes.DELETE,
                transaction,
            });
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export { deleteAccount };
