import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

// Thèmes exclusifs proposés aux offres payantes. Le rendu vit côté frontend ;
// l'API ne stocke que l'identifiant choisi, et refuse tout ce qu'elle ne connaît pas.
const THEMES = ['default', 'midnight', 'sakura', 'sunset', 'forest', 'mono'];

const fail = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Les images sont référencées par URL : pas de stockage à héberger, et le GIF
// animé promis aux offres payantes fonctionne sans traitement particulier.
function assertImageUrl(value, field) {
    if (value === null || value === undefined || value === '') return null;

    const raw = String(value).trim();
    if (raw.length > 300) throw fail(`${field} : URL trop longue (300 caractères maximum)`, 400);

    let url;
    try {
        url = new URL(raw);
    } catch {
        throw fail(`${field} : URL invalide`, 400);
    }

    // La CSP n'autorise les images que sur https : accepter http ne ferait que produire
    // une image bloquée par le navigateur.
    if (url.protocol !== 'https:') throw fail(`${field} : seules les URL https sont acceptées`, 400);

    return raw;
}

async function getAppearance(username) {
    const rows = await sequelize.query(
        `SELECT avatar_url AS "avatarUrl", banner_url AS "bannerUrl", COALESCE(theme, 'default') AS theme
         FROM "Client" WHERE name = :username`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    if (rows.length === 0) throw fail('Client introuvable', 404);
    return rows[0];
}

async function updateAppearance(username, { avatarUrl, bannerUrl, theme }) {
    const assignments = [];
    const replacements = { username };

    if (avatarUrl !== undefined) {
        assignments.push('avatar_url = :avatarUrl');
        replacements.avatarUrl = assertImageUrl(avatarUrl, 'Avatar');
    }
    if (bannerUrl !== undefined) {
        assignments.push('banner_url = :bannerUrl');
        replacements.bannerUrl = assertImageUrl(bannerUrl, 'Bannière');
    }
    if (theme !== undefined) {
        if (!THEMES.includes(theme)) throw fail('Thème inconnu', 400);
        assignments.push('theme = :theme');
        replacements.theme = theme;
    }

    if (assignments.length > 0) {
        await sequelize.query(
            `UPDATE "Client" SET ${assignments.join(', ')} WHERE name = :username`,
            { replacements, type: QueryTypes.UPDATE }
        );
    }

    return getAppearance(username);
}

export { THEMES, getAppearance, updateAppearance };
