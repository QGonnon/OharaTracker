import express from 'express';
import { getClient } from '../utils/database.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

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