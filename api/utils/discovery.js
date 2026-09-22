import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

// Préférences de la page Découverte. Stockées en JSONB plutôt qu'en colonnes :
// la Découverte évoluera plus vite que le schéma.
const DISCOVERY_TYPES = ['all', 'manga', 'anime'];
const MAX_PINNED_GENRES = 10;

const fail = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

async function getDiscoveryPreferences(username) {
    const rows = await sequelize.query(
        'SELECT discovery_preferences AS preferences FROM "Client" WHERE name = :username',
        { replacements: { username }, type: QueryTypes.SELECT }
    );
    return rows[0]?.preferences ?? null;
}

async function updateDiscoveryPreferences(username, { defaultType, pinnedGenres, hideTrending, hideSpotlight }) {
    if (defaultType !== undefined && !DISCOVERY_TYPES.includes(defaultType)) {
        throw fail('Type par défaut inconnu', 400);
    }
    if (pinnedGenres !== undefined) {
        if (!Array.isArray(pinnedGenres) || pinnedGenres.length > MAX_PINNED_GENRES) {
            throw fail(`Au maximum ${MAX_PINNED_GENRES} genres épinglés`, 400);
        }
        if (pinnedGenres.some(genre => typeof genre !== 'string' || genre.length > 40)) {
            throw fail('Genre invalide', 400);
        }
    }

    const preferences = {
        defaultType: defaultType ?? 'all',
        pinnedGenres: pinnedGenres ?? [],
        hideTrending: hideTrending === true,
        hideSpotlight: hideSpotlight === true,
    };

    await sequelize.query(
        'UPDATE "Client" SET discovery_preferences = :preferences::jsonb WHERE name = :username',
        {
            replacements: { username, preferences: JSON.stringify(preferences) },
            type: QueryTypes.UPDATE,
        }
    );

    return preferences;
}

export { DISCOVERY_TYPES, getDiscoveryPreferences, updateDiscoveryPreferences };
