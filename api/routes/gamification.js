import express from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../utils/database.js';
import { getBadges } from '../utils/badges.js';
import { authenticate } from '../utils/auth.js';
import { slugify, resolveMediaKind } from '../utils/slug.js';

const router = express.Router();

router.get('/badges', authenticate, async (req, res) => {
    try {
        res.json(await getBadges(req.user.username));
    } catch (error) {
        console.error('❌ Erreur lors du calcul des badges:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Classement des œuvres : agrégat anonyme, aucune donnée personnelle exposée.
router.get('/leaderboard/works', async (_req, res) => {
    try {
        const rows = await sequelize.query(
            `SELECT l.id, l.name AS title, lt.type AS type,
                    l.cover_path AS "coverPath", l.cover_url AS "coverUrl",
                    COUNT(DISTINCT lu.name_client)::int AS followers,
                    ROUND(AVG(lu.score), 2) AS "averageScore"
             FROM "Library" l
             JOIN libraryusage lu ON lu.id_library = l.id
             LEFT JOIN "LibrarySource" ls ON ls.id_library = l.id
             LEFT JOIN "LibraryType" lt ON ls.id_library_type = lt.id
             GROUP BY l.id, l.name, lt.type, l.cover_path, l.cover_url
             ORDER BY followers DESC, "averageScore" DESC NULLS LAST, l.name ASC
             LIMIT 20`,
            { type: QueryTypes.SELECT }
        );

        res.json(rows.filter(row => row.title && slugify(row.title)).map(row => ({
            title: row.title,
            slug: slugify(row.title),
            kind: resolveMediaKind(row.type),
            coverPath: row.coverPath,
            coverUrl: row.coverUrl,
            followers: row.followers,
            averageScore: row.averageScore === null ? null : Number(row.averageScore),
        })));
    } catch (error) {
        console.error('❌ Erreur lors du classement des œuvres:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Classement entre amis : un palmarès global exposerait l'activité de comptes
// qui ne l'ont pas choisi, alors que l'amitié est déjà un consentement mutuel.
router.get('/leaderboard/friends', authenticate, async (req, res) => {
    try {
        const rows = await sequelize.query(
            `WITH circle AS (
                SELECT :username AS name
                UNION
                SELECT name_friend FROM "Friendship"
                WHERE name_client = :username AND status = 'accepted'
            )
            SELECT c.name AS username,
                   cl.avatar_url AS "avatarUrl",
                   COUNT(lu.id_library)::int AS "worksTracked",
                   COUNT(lu.id_library) FILTER (WHERE lu.reading_status = 'Terminé')::int AS completed,
                   ROUND(AVG(lu.score), 2) AS "averageScore"
            FROM circle c
            JOIN "Client" cl ON cl.name = c.name
            LEFT JOIN libraryusage lu ON lu.name_client = c.name
            GROUP BY c.name, cl.avatar_url
            ORDER BY "worksTracked" DESC, completed DESC, c.name ASC`,
            { replacements: { username: req.user.username }, type: QueryTypes.SELECT }
        );

        res.json(rows.map((row, index) => ({
            rank: index + 1,
            username: row.username,
            avatarUrl: row.avatarUrl,
            worksTracked: row.worksTracked,
            completed: row.completed,
            averageScore: row.averageScore === null ? null : Number(row.averageScore),
            isMe: row.username === req.user.username,
        })));
    } catch (error) {
        console.error('❌ Erreur lors du classement entre amis:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
