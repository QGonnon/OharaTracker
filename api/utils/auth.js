import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

// Il y avait ici un repli sur une constante en dur. Une chaîne vide étant falsy,
// un JWT_SECRET absent OU vide basculait dessus sans un mot : tous les jetons
// étaient alors signés avec une valeur lisible dans le dépôt, donc forgeables
// par n'importe qui pour n'importe quel compte.
//
// En production, on refuse de démarrer. En développement, on tire un secret
// aléatoire pour la durée du processus : les sessions ne survivent pas à un
// redémarrage, ce qui est justement le rappel qu'il manque une variable.
const GENERATE_HINT = 'node -p "require(\'crypto\').randomBytes(48).toString(\'base64url\')"';

function resolveJwtSecret() {
    const configured = process.env.JWT_SECRET?.trim();
    if (configured) return configured;

    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            `JWT_SECRET est absent ou vide. Refus de démarrer : sans lui, les jetons seraient `
            + `signés avec une valeur prévisible. Générez-en un avec : ${GENERATE_HINT}`
        );
    }

    console.warn(
        `⚠️  JWT_SECRET absent ou vide : un secret aléatoire est utilisé pour cette session. `
        + `Vous serez déconnecté à chaque redémarrage de l'API tant qu'il n'est pas défini `
        + `dans api/.env. Générez-en un avec : ${GENERATE_HINT}`
    );
    return crypto.randomBytes(48).toString('base64url');
}

const JWT_SECRET = resolveJwtSecret();

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

export { authenticate, JWT_SECRET };
