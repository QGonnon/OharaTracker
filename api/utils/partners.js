import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

// Partenaires actifs, éventuellement restreints à un type et à une langue.
// `locales IS NULL` signifie « toutes langues » : un tel partenaire sort toujours.
async function getActivePartners({ kind = null, locale = null } = {}) {
    return sequelize.query(
        `SELECT name, kind, url, logo_url AS "logoUrl", description, locales,
                is_highlighted AS "isHighlighted"
         FROM "Partner"
         WHERE is_active = true
           AND (:kind::text IS NULL OR kind = :kind)
           AND (:locale::text IS NULL OR locales IS NULL OR :locale = ANY(locales))
         ORDER BY is_highlighted DESC, name ASC`,
        { replacements: { kind, locale }, type: QueryTypes.SELECT }
    );
}

// Un code d'affiliation n'est valide que s'il appartient à un partenaire actif.
async function findActiveAffiliateCode(code) {
    const rows = await sequelize.query(
        'SELECT affiliate_code AS "affiliateCode" FROM "Partner" WHERE affiliate_code = :code AND is_active = true LIMIT 1',
        { replacements: { code }, type: QueryTypes.SELECT }
    );
    return rows[0]?.affiliateCode ?? null;
}

export { getActivePartners, findActiveAffiliateCode };
