import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

async function getSavedFilters(username) {
    return sequelize.query(
        `SELECT id, label, payload FROM "SavedFilter"
         WHERE name_client = :username ORDER BY created_at ASC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );
}

async function countSavedFilters(username) {
    const rows = await sequelize.query(
        'SELECT COUNT(*)::int AS count FROM "SavedFilter" WHERE name_client = :username',
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    return rows[0]?.count ?? 0;
}

// Réenregistrer sous un nom existant écrase la vue : c'est le geste attendu.
async function upsertSavedFilter(username, { label, payload }) {
    const [rows] = await sequelize.query(
        `INSERT INTO "SavedFilter" (name_client, label, payload, created_at)
         VALUES (:username, :label, :payload::jsonb, NOW())
         ON CONFLICT ON CONSTRAINT saved_filter_unique_label_per_client
         DO UPDATE SET payload = EXCLUDED.payload
         RETURNING id, label, payload`,
        {
            replacements: { username, label, payload: JSON.stringify(payload) },
            type: QueryTypes.INSERT,
        }
    );
    return rows[0];
}

async function deleteSavedFilter(username, id) {
    const deleted = await sequelize.query(
        'DELETE FROM "SavedFilter" WHERE id = :id AND name_client = :username RETURNING id',
        { replacements: { id, username }, type: QueryTypes.DELETE }
    );
    return Boolean(deleted?.length);
}

export { getSavedFilters, countSavedFilters, upsertSavedFilter, deleteSavedFilter };
