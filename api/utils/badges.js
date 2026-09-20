import { QueryTypes } from 'sequelize';
import { sequelize } from './database.js';

// Les badges sont dérivés à la lecture plutôt que stockés : aucune table à
// resynchroniser, et un badge reste vrai même si l'utilisateur retire une œuvre.
const BADGES = [
    { key: 'librarian', metric: 'worksTracked', tiers: [10, 50, 100] },
    { key: 'marathoner', metric: 'chaptersRead', tiers: [100, 1000, 5000] },
    { key: 'critic', metric: 'ratings', tiers: [10, 50, 200] },
    { key: 'finisher', metric: 'completed', tiers: [5, 25, 100] },
    { key: 'social', metric: 'friends', tiers: [1, 10, 50] },
    { key: 'curator', metric: 'lists', tiers: [1, 5, 20] },
    { key: 'explorer', metric: 'genres', tiers: [5, 20, 50] },
];

const TIER_NAMES = ['bronze', 'silver', 'gold'];

async function getBadgeMetrics(username) {
    const [row] = await sequelize.query(
        `SELECT
            (SELECT COUNT(*) FROM libraryusage WHERE name_client = :username)::int AS "worksTracked",
            (SELECT COALESCE(SUM(last_chapter::numeric), 0) FROM libraryusage lu
             LEFT JOIN "LibrarySource" ls ON ls.id_library = lu.id_library AND ls.id_source = lu.id_source
             LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
             WHERE lu.name_client = :username AND COALESCE(lt.type, '') NOT IN ('Anime', 'anime'))::int AS "chaptersRead",
            (SELECT COUNT(*) FROM libraryusage WHERE name_client = :username AND score IS NOT NULL)::int AS "ratings",
            (SELECT COUNT(*) FROM libraryusage WHERE name_client = :username AND reading_status = 'Terminé')::int AS "completed",
            (SELECT COUNT(*) FROM "Friendship" WHERE name_client = :username AND status = 'accepted')::int AS "friends",
            (SELECT COUNT(*) FROM "Watchlist" WHERE name_client = :username)::int AS "lists",
            (SELECT COUNT(DISTINCT t.name) FROM libraryusage lu
             JOIN "Tag" t ON t.id_library = lu.id_library
             WHERE lu.name_client = :username AND t.name IS NOT NULL)::int AS "genres"`,
        { replacements: { username }, type: QueryTypes.SELECT }
    );

    return row ?? {};
}

async function getBadges(username) {
    const metrics = await getBadgeMetrics(username);

    return BADGES.map(badge => {
        const value = Number(metrics[badge.metric] ?? 0);
        const reached = badge.tiers.filter(threshold => value >= threshold).length;
        // Le palier suivant sert de jauge : un badge sans horizon n'incite à rien.
        const next = badge.tiers[reached] ?? null;

        return {
            key: badge.key,
            value,
            tier: reached > 0 ? TIER_NAMES[reached - 1] : null,
            earned: reached > 0,
            next,
            progress: next ? Math.min(100, Math.round((value / next) * 100)) : 100,
        };
    });
}

export { getBadges, BADGES, TIER_NAMES };
