import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const router = express.Router();

// Connexion à la base de données
async function openDb() {
    return open({
        filename: './manga.db',
        driver: sqlite3.Database
    });
}

// Secret pour JWT (à mettre dans .env en production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Route d'inscription
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // Validation basique
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const db = await openDb();

    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await db.get('SELECT name FROM Client WHERE name = ? OR email = ?', [username, email]);
        
        if (existingUser) {
            return res.status(400).json({ message: 'Nom d\'utilisateur ou email déjà utilisé' });
        }

        // Créer une subscription par défaut (id=1) si elle n'existe pas
        let subscription = await db.get('SELECT id FROM Subscription WHERE id = 1');
        if (!subscription) {
            await db.run('INSERT INTO Subscription (id, name) VALUES (1, ?)', ['Free']);
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer le nouvel utilisateur
        await db.run(
            `INSERT INTO Client (name, email, password, display_name, id_subscription) 
             VALUES (?, ?, ?, ?, 1)`,
            [username, email, hashedPassword, username]
        );

        res.status(201).json({ message: 'Utilisateur créé avec succès' });

    } catch (error) {
        console.error('❌ Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
    } finally {
        await db.close();
    }
});

// Route de connexion
router.post('/signin', async (req, res) => {
    const { username, password } = req.body;

    // Validation basique
    if (!username || !password) {
        return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const db = await openDb();

    try {
        // Récupérer l'utilisateur
        const user = await db.get(
            'SELECT name, email, password, display_name FROM Client WHERE name = ?',
            [username]
        );

        if (!user) {
            return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }

        // Générer un token JWT
        const token = jwt.sign(
            { username: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Retourner les infos utilisateur (sans le mot de passe) et le token
        res.json({
            username: user.name,
            email: user.email,
            displayName: user.display_name,
            accessToken: token
        });

    } catch (error) {
        console.error('❌ Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    } finally {
        await db.close();
    }
});

export default router;
