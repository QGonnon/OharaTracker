import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../utils/database.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    try {
        const existing = await sequelize.query(
            'SELECT name FROM "Client" WHERE name = :username OR email = :email LIMIT 1',
            { replacements: { username, email }, type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Nom d\'utilisateur ou email déjà utilisé' });
        }

        await sequelize.query(
            `INSERT INTO "Subscription" (id, name) VALUES (1, 'Free') ON CONFLICT (id) DO NOTHING`,
            { type: QueryTypes.INSERT }
        );

        const hashedPassword = await bcrypt.hash(password, 10);
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

        await sequelize.query(
            'INSERT INTO "Client" (name, code, email, password, id_subscription) VALUES (:username, :code, :email, :password, 1)',
            {
                replacements: { username, code: randomSuffix, email, password: hashedPassword },
                type: QueryTypes.INSERT
            }
        );

        res.status(201).json({ message: 'Utilisateur créé avec succès' });

    } catch (error) {
        console.error('❌ Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
    }
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    try {
        const users = await sequelize.query(
            'SELECT name, code, email, password FROM "Client" WHERE email = :email LIMIT 1',
            { replacements: { email }, type: QueryTypes.SELECT }
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const token = jwt.sign(
            { username: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            username: user.name,
            email: user.email,
            code: user.code,
            accessToken: token
        });

    } catch (error) {
        console.error('❌ Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    }
});

router.post('/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: 'Credential Google manquant' });
    }

    try {
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(Buffer.from(base64, 'base64').toString().split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const googleUser = JSON.parse(jsonPayload);
        const email = googleUser.email;
        const name = googleUser.name || googleUser.email.split('@')[0];
        const cleanName = name.replace(/\s+/g, '_').substring(0, 24);
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const googleId = googleUser.sub;

        let users = await sequelize.query(
            'SELECT name, code, email, google_id FROM "Client" WHERE email = :email LIMIT 1',
            { replacements: { email }, type: QueryTypes.SELECT }
        );

        if (users.length === 0) {
            await sequelize.query(
                `INSERT INTO "Subscription" (id, name) VALUES (1, 'Free') ON CONFLICT (id) DO NOTHING`,
                { type: QueryTypes.INSERT }
            );

            await sequelize.query(
                'INSERT INTO "Client" (name, code, email, password, google_id, id_subscription) VALUES (:name, :code, :email, :password, :googleId, 1)',
                {
                    replacements: { name: cleanName, code: randomSuffix, email, password: '', googleId },
                    type: QueryTypes.INSERT
                }
            );

            users = await sequelize.query(
                'SELECT name, code, email, google_id FROM "Client" WHERE email = :email LIMIT 1',
                { replacements: { email }, type: QueryTypes.SELECT }
            );
        } else if (!users[0].google_id) {
            await sequelize.query(
                'UPDATE "Client" SET google_id = :googleId WHERE email = :email',
                { replacements: { googleId, email }, type: QueryTypes.UPDATE }
            );
        }

        const user = users[0];
        const token = jwt.sign(
            { username: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            username: user.name,
            email: user.email,
            code: user.code,
            accessToken: token
        });

    } catch (error) {
        console.error('❌ Erreur lors de la connexion Google:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion Google' });
    }
});

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

router.get('/me', authenticate, async (req, res) => {
    const username = req.user.username;
    try {
        const users = await sequelize.query(
            'SELECT name, code, email, password, google_id FROM "Client" WHERE name = :username LIMIT 1',
            { replacements: { username }, type: QueryTypes.SELECT }
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        const user = users[0];
        res.json({
            username: user.name,
            code: user.code,
            email: user.email,
            isGoogleUser: !!user.google_id,
            hasPassword: !!user.password
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du profil:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.put('/profile', authenticate, async (req, res) => {
    const { username, email } = req.body;
    const currentUsername = req.user.username;

    if (!username && !email) {
        return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
    }

    try {
        const users = await sequelize.query(
            'SELECT name, code, email FROM "Client" WHERE name = :currentUsername LIMIT 1',
            { replacements: { currentUsername }, type: QueryTypes.SELECT }
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const user = users[0];
        const newUsername = username || user.name;
        const newEmail = email || user.email;

        if (newUsername !== currentUsername) {
            const conflict = await sequelize.query(
                'SELECT name FROM "Client" WHERE name = :newUsername LIMIT 1',
                { replacements: { newUsername }, type: QueryTypes.SELECT }
            );
            if (conflict.length > 0) {
                return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
            }
        }

        if (newEmail !== user.email) {
            const conflict = await sequelize.query(
                'SELECT name FROM "Client" WHERE email = :newEmail AND name != :currentUsername LIMIT 1',
                { replacements: { newEmail, currentUsername }, type: QueryTypes.SELECT }
            );
            if (conflict.length > 0) {
                return res.status(400).json({ message: 'Cette adresse email est déjà utilisée' });
            }
        }

        if (newUsername !== currentUsername) {
            await sequelize.query(
                'UPDATE "ClientCategoryAssignment" SET name_client = :newUsername WHERE name_client = :currentUsername',
                { replacements: { newUsername, currentUsername }, type: QueryTypes.UPDATE }
            );
        }

        await sequelize.query(
            'UPDATE "Client" SET name = :newUsername, email = :newEmail WHERE name = :currentUsername',
            { replacements: { newUsername, newEmail, currentUsername }, type: QueryTypes.UPDATE }
        );

        const newToken = jwt.sign(
            { username: newUsername, email: newEmail },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            username: newUsername,
            email: newEmail,
            accessToken: newToken,
        });
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil' });
    }
});

router.post('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const username = req.user.username;

    try {
        const users = await sequelize.query(
            'SELECT name, password, google_id FROM "Client" WHERE name = :username LIMIT 1',
            { replacements: { username }, type: QueryTypes.SELECT }
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const user = users[0];
        const firstPasswordChange = !user.password && user.google_id;

        if ((!currentPassword || !newPassword) && !firstPasswordChange) {
            return res.status(400).json({ message: 'Les deux mots de passe sont requis' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid && !firstPasswordChange) {
            return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await sequelize.query(
            'UPDATE "Client" SET password = :password WHERE name = :username',
            { replacements: { password: hashedPassword, username }, type: QueryTypes.UPDATE }
        );

        res.json({ message: 'Mot de passe modifié avec succès' });

    } catch (error) {
        console.error('❌ Erreur lors du changement de mot de passe:', error);
        res.status(500).json({ message: 'Erreur serveur lors du changement de mot de passe' });
    }
});

export default router;
