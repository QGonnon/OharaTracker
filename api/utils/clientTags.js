import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

const fail = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Tags de l'utilisateur avec, pour chacun, les œuvres auxquelles il est appliqué.
async function getClientTags(username) {
    const rows = await sequelize.query(
        `SELECT
            t.id            AS id,
            t.label         AS label,
            t.color         AS color,
            a.id_library    AS "idLibrary"
         FROM "ClientTag" t
         LEFT JOIN "ClientTagAssignment" a ON a.id_client_tag = t.id
         WHERE t.name_client = :username
         ORDER BY t.label ASC`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    const tags = new Map();
    for (const row of rows) {
        if (!tags.has(row.id)) {
            tags.set(row.id, { id: row.id, label: row.label, color: row.color, works: [] });
        }
        if (row.idLibrary !== null) tags.get(row.id).works.push(row.idLibrary);
    }

    return [...tags.values()];
}

async function countClientTags(username) {
    const rows = await sequelize.query(
        'SELECT COUNT(*)::int AS count FROM "ClientTag" WHERE name_client = :username',
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    return rows[0]?.count ?? 0;
}

async function createClientTag(username, { label, color }) {
    const clean = String(label ?? '').trim();
    if (!clean) throw fail('Libellé requis', 400);
    if (clean.length > 30) throw fail('Libellé trop long (30 caractères maximum)', 400);

    const existing = await sequelize.query(
        'SELECT id FROM "ClientTag" WHERE name_client = :username AND LOWER(label) = LOWER(:label) LIMIT 1',
        { replacements: { username, label: clean }, type: QueryTypes.SELECT }
    );
    if (existing.length > 0) throw fail('Ce tag existe déjà', 409);

    const [rows] = await sequelize.query(
        `INSERT INTO "ClientTag" (name_client, label, color, created_at)
         VALUES (:username, :label, :color, NOW())
         RETURNING id, label, color`,
        { replacements: { username, label: clean, color: color || null }, type: QueryTypes.INSERT }
    );

    return { ...rows[0], works: [] };
}

async function deleteClientTag(username, id) {
    const deleted = await sequelize.query(
        'DELETE FROM "ClientTag" WHERE id = :id AND name_client = :username RETURNING id',
        { replacements: { id, username }, type: QueryTypes.DELETE }
    );

    // Un tag appartenant à quelqu'un d'autre est traité comme inexistant : pas de fuite d'information.
    if (!deleted?.length) throw fail('Tag introuvable', 404);
}

// Vérifie que le tag appartient bien au demandeur avant toute (dé)association.
async function assertTagOwnership(username, id) {
    const rows = await sequelize.query(
        'SELECT id FROM "ClientTag" WHERE id = :id AND name_client = :username LIMIT 1',
        { replacements: { id, username }, type: QueryTypes.SELECT }
    );
    if (rows.length === 0) throw fail('Tag introuvable', 404);
}

async function assignClientTag(username, id, idLibrary) {
    await assertTagOwnership(username, id);

    await sequelize.query(
        `INSERT INTO "ClientTagAssignment" (id_client_tag, id_library)
         VALUES (:id, :idLibrary)
         ON CONFLICT DO NOTHING`,
        { replacements: { id, idLibrary }, type: QueryTypes.INSERT }
    );
}

async function unassignClientTag(username, id, idLibrary) {
    await assertTagOwnership(username, id);

    await sequelize.query(
        'DELETE FROM "ClientTagAssignment" WHERE id_client_tag = :id AND id_library = :idLibrary',
        { replacements: { id, idLibrary }, type: QueryTypes.DELETE }
    );
}

export {
    getClientTags,
    countClientTags,
    createClientTag,
    deleteClientTag,
    assignClientTag,
    unassignClientTag,
};
