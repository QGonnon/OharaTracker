import express from 'express';
import jwt from 'jsonwebtoken';
import {
    addLibraryToUser,
    deleteUserLibrary,
    getUserLibrary,
    isLibraryInUserLibrary,
    updateUserLibrary,
} from '../utils/database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
}

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
    const { id, lastChapter, readingStatus, title, site } = req.body;

    try {
        const result = await updateUserLibrary({
            id,
            lastChapter,
            readingStatus,
            title,
            site: site || null,
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
