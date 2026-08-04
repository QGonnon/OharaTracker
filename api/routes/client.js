import express from 'express';
import jwt from 'jsonwebtoken';
import { getClient } from '../utils/database.js';

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

router.get('/', authenticate, (req, res) => {
    getClient(req.user.username, (err, client) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(client);
    })
});

export default router;