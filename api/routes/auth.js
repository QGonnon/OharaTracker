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
        const randomSuffix = Math.random().toString(36).substring(2, 6); // Ajouter un suffixe de 4 caractères alphanumériques

        // Insérer le nouvel utilisateur
        await db.run(
            `INSERT INTO Client (name, code, email, password, id_subscription) 
             VALUES (?, ?, ?, ?, 1)`,
            [username, randomSuffix, email, hashedPassword]
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
            'SELECT name, code, email, password FROM Client WHERE name = ?',
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
            code: user.code,
            accessToken: token
        });

    } catch (error) {
        console.error('❌ Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    } finally {
        await db.close();
    }
});

// Route de connexion Google
router.post('/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: 'Credential Google manquant' });
    }

    const db = await openDb();

    try {
        // Décoder le JWT Google (sans vérification - en production, utilisez google-auth-library)
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const googleUser = JSON.parse(jsonPayload);
        const email = googleUser.email;
        const name = googleUser.name || googleUser.email.split('@')[0];
        const cleanDisplayName = name.replace(/\s+/g, '_').substring(0, 24); // Limiter à 24 caractères et remplacer les espaces
        const randomSuffix = Math.random().toString(36).substring(2, 6); // Ajouter un suffixe de 4 caractères alphanumériques
        const googleId = googleUser.sub;

        // Vérifier si l'utilisateur existe déjà
        let user = await db.get('SELECT name, code, email, google_id FROM Client WHERE email = ?', [email]);

        if (!user) {
            // Créer une subscription par défaut (id=1) si elle n'existe pas
            let subscription = await db.get('SELECT id FROM Subscription WHERE id = 1');
            if (!subscription) {
                await db.run('INSERT INTO Subscription (id, name) VALUES (1, ?)', ['Free']);
            }

            // Créer un nouvel utilisateur
            await db.run(
                `INSERT INTO Client (name, code, email, password, google_id, id_subscription) 
                 VALUES (?, ?, ?, ?, ?, 1)`,
                [cleanDisplayName, randomSuffix, email, '', googleId]
            );

            user = await db.get('SELECT name, code, email, google_id FROM Client WHERE email = ?', [email]);
        } else if (!user.google_id) {
            // Lier le compte Google à un compte existant
            await db.run('UPDATE Client SET google_id = ? WHERE email = ?', [googleId, email]);
        }

        // Générer un token JWT
        const token = jwt.sign(
            { username: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Retourner les infos utilisateur et le token
        res.json({
            username: user.name,
            email: user.email,
            code: user.code,
            accessToken: token
        });

    } catch (error) {
        console.error('❌ Erreur lors de la connexion Google:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion Google' });
    } finally {
        await db.close();
    }
});

// Middleware d'authentification JWT
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
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
}

// Récupérer les données de l'utilisateur connecté
router.get('/me', authenticate, async (req, res) => {
    const username = req.user.username;
    const db = await openDb();
    try {
        const user = await db.get('SELECT name, code, email, google_id FROM Client WHERE name = ?', [username]);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        res.json({
            username: user.name,
            code: user.code,
            email: user.email,
            isGoogleUser: !!user.google_id,
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du profil:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    } finally {
        await db.close();
    }
});

// Mise à jour du profil
router.put('/profile', authenticate, async (req, res) => {
    const { username, email, displayName } = req.body;
    const currentUsername = req.user.username;

    if (!username && !email && !displayName) {
        return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
    }

    const db = await openDb();

    try {
        const user = await db.get('SELECT name, code, email FROM Client WHERE name = ?', [currentUsername]);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const newUsername = username || user.name;
        const newEmail = email || user.email;

        // Vérifier les conflits si le nom ou l'email change
        if (newUsername !== currentUsername) {
            const conflict = await db.get('SELECT name FROM Client WHERE name = ?', [newUsername]);
            if (conflict) {
                return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
            }
        }
        if (newEmail !== user.email) {
            const conflict = await db.get('SELECT name FROM Client WHERE email = ? AND name != ?', [newEmail, currentUsername]);
            if (conflict) {
                return res.status(400).json({ message: 'Cette adresse email est déjà utilisée' });
            }
        }

        // Mettre à jour les FK si le username change
        if (newUsername !== currentUsername) {
            await db.run('UPDATE ClientCategoryAssignment SET name_client = ? WHERE name_client = ?', [newUsername, currentUsername]);
        }

        await db.run(
            'UPDATE Client SET name = ?, email = ? WHERE name = ?',
            [newUsername, newEmail,, currentUsername]
        );

        // Générer un nouveau token avec le username mis à jour
        const newToken = jwt.sign(
            { username: newUsername, email: newEmail },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            username: newUsername,
            email: newEmail,
            displayName: newDisplayName,
            accessToken: newToken,
        });

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil' });
    } finally {
        await db.close();
    }
});

// Changement de mot de passe
router.post('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const username = req.user.username;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Les deux mots de passe sont requis' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    const db = await openDb();

    try {
        const user = await db.get('SELECT name, password FROM Client WHERE name = ?', [username]);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run('UPDATE Client SET password = ? WHERE name = ?', [hashedPassword, username]);

        res.json({ message: 'Mot de passe modifié avec succès' });

    } catch (error) {
        console.error('❌ Erreur lors du changement de mot de passe:', error);
        res.status(500).json({ message: 'Erreur serveur lors du changement de mot de passe' });
    } finally {
        await db.close();
    }
});

export default router;
