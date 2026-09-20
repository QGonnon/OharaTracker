import express from 'express';
import {
    addLibraryToUser,
    deleteUserLibrary,
    getUserLibrary,
    isLibraryInUserLibrary,
    updateUserLibrary,
} from '../utils/database.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
    const {
        title,
        author,
        theme,
        status,
        description,
        coverPath,
        coverUrl,
        lastChapter,
        chapterUrl,
        mangaUrl,
        site
    } = req.body;

    if (!title || !site) {
        return res.status(400).json({ message: 'Champs manquants: title et site requis' });
    }

    try {
        const result = await addLibraryToUser({
            title,
            author,
            theme,
            status,
            description,
            coverPath,
            coverUrl,
            lastChapter,
            chapterUrl,
            mangaUrl,
            site,
            username: req.user.username,
        });

        if (result.duplicate) {
            return res.status(409).json({ message: 'Déjà dans votre bibliothèque.' });
        }

        res.json({ message: 'Manga ajouté à votre bibliothèque', idLibrary: result.idLibrary });
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout à la bibliothèque:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur lors de l\'ajout du manga' });
    }
});

router.get('/status', authenticate, async (req, res) => {
    const { title, site } = req.query;
    if (!title) return res.status(400).json({ message: 'Titre requis' });

    try {
        const inLibrary = await isLibraryInUserLibrary({ title, site: site || null, username: req.user.username });
        res.json({ inLibrary });
    } catch (error) {
        console.error('❌ Erreur lors de la vérification bibliothèque:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

router.get('/user', authenticate, async (req, res) => {
    try {
        const rows = await getUserLibrary(req.user.username);

        res.json(rows || []);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la bibliothèque:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

router.patch('/user', authenticate, async (req, res) => {
    const { id, lastChapter, readingStatus, title, site, notifyEnabled, score, note } = req.body;

    if (score !== undefined && score !== null) {
        const value = Number(score);
        if (!Number.isFinite(value) || value < 0 || value > 10) {
            return res.status(400).json({ message: 'Note invalide : attendu un nombre entre 0 et 10' });
        }
    }

    if (note !== undefined && note !== null && String(note).length > 2000) {
        return res.status(400).json({ message: 'Commentaire trop long (2000 caractères maximum)' });
    }

    try {
        const result = await updateUserLibrary({
            id,
            lastChapter,
            readingStatus,
            title,
            site: site || null,
            notifyEnabled: typeof notifyEnabled === 'boolean' ? notifyEnabled : null,
            score: score === undefined || score === null || score === '' ? null : Number(score),
            note: note === undefined ? null : note,
            username: req.user.username,
        });

        res.json({ message: 'Mise à jour enregistrée', idLibrary: result.idLibrary });
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de la bibliothèque utilisateur:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

router.delete('/user', authenticate, async (req, res) => {
    const { title, site } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Title requis' });
    }

    try {
        await deleteUserLibrary({ title, site: site || null, username: req.user.username });

        res.json({ message: 'Manga supprimé de votre bibliothèque' });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du manga utilisateur:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Erreur serveur' });
    }
});

export default router;
