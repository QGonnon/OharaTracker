import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
    findClientByNameOrEmail,
    createClient,
    findClientByEmail,
    findGoogleClientByEmail,
    createGoogleClient,
    linkGoogleId,
    getAccountProfile,
    findClientByName,
    isUsernameTaken,
    isEmailTakenByAnother,
    renameClient,
    getPasswordRecord,
    setPassword,
} from '../utils/accounts.js';
import { authenticate, JWT_SECRET } from '../utils/auth.js';

const router = express.Router();

const issueToken = user => jwt.sign(
    { id: user.id, username: user.name ?? user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
);

router.post('/signup', async (req, res) => {
    const { username, email, password, referralCode } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    try {
        if (await findClientByNameOrEmail(username, email)) {
            return res.status(400).json({ message: 'Nom d\'utilisateur ou email déjà utilisé' });
        }

        await createClient({
            username,
            email,
            hashedPassword: await bcrypt.hash(password, 10),
            referralCode,
        });

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
        const user = await findClientByEmail(email);

        // Même message que le mot de passe erroné : distinguer les deux cas
        // permettrait d'énumérer les adresses inscrites.
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        res.json({
            id: user.id,
            username: user.name,
            email: user.email,
            code: user.code,
            accessToken: issueToken(user),
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
        const googleId = googleUser.sub;

        let user = await findGoogleClientByEmail(email);

        if (!user) {
            user = await createGoogleClient({ name: cleanName, email, googleId });
        } else if (!user.googleId) {
            await linkGoogleId(email, googleId);
        }

        res.json({
            id: user.id,
            username: user.name,
            email: user.email,
            code: user.code,
            accessToken: issueToken(user),
        });
    } catch (error) {
        console.error('❌ Erreur lors de la connexion Google:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion Google' });
    }
});

router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await getAccountProfile(req.user.username);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        res.json({
            username: user.name,
            code: user.code,
            email: user.email,
            isGoogleUser: !!user.googleId,
            hasPassword: !!user.password,
            subscription: user.subscriptionName,
            hasActiveStripeSubscription: !!user.stripeSubscriptionId,
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
        const user = await findClientByName(currentUsername);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const newUsername = username || user.name;
        const newEmail = email || user.email;

        if (newUsername !== currentUsername && await isUsernameTaken(newUsername)) {
            return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
        }

        if (newEmail !== user.email && await isEmailTakenByAnother(newEmail, currentUsername)) {
            return res.status(400).json({ message: 'Cette adresse email est déjà utilisée' });
        }

        await renameClient({ currentUsername, newUsername, newEmail });

        res.json({
            username: newUsername,
            email: newEmail,
            accessToken: issueToken({ id: user.id, name: newUsername, email: newEmail }),
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
        const user = await getPasswordRecord(username);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        // Un compte Google sans mot de passe en définit un pour la première fois :
        // il n'y a alors aucun mot de passe actuel à confirmer.
        const firstPasswordChange = !user.password && user.googleId;

        if ((!currentPassword || !newPassword) && !firstPasswordChange) {
            return res.status(400).json({ message: 'Les deux mots de passe sont requis' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
        }

        if (!firstPasswordChange && !await bcrypt.compare(currentPassword, user.password)) {
            return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
        }

        await setPassword(username, await bcrypt.hash(newPassword, 10));

        res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
        console.error('❌ Erreur lors du changement de mot de passe:', error);
        res.status(500).json({ message: 'Erreur serveur lors du changement de mot de passe' });
    }
});

export default router;
