import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Stockage des couvertures dans /cdn à la racine du projet
const CDN_DIR = path.resolve(__dirname, '../..', 'cdn');

// --- Télécharge la cover dans le dossier cdn ---
async function downloadCover(coverUrl, coverFileName) {
    if (!coverUrl || !coverFileName) return null;

    // Nettoyer les caractères spéciaux du nom de fichier pour Windows
    const sanitizedFileName = coverFileName
        .replace(/[<>:"|?*]/g, '')  // Supprimer les caractères invalides Windows
        .replace(/\s+/g, '-')       // Remplacer les espaces par des tirets
        .replace(/--+/g, '-');      // Remplacer les tirets multiples par un seul

    await fs.mkdir(CDN_DIR, { recursive: true });
    const targetPath = path.join(CDN_DIR, sanitizedFileName);

    try {
        await fs.access(targetPath);
        return sanitizedFileName; // Déjà présent
    } catch (_) {
        // continue pour télécharger
    }

    try {
        const response = await fetch(coverUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(targetPath, buffer);
        return sanitizedFileName;
    } catch (error) {
        console.error(`❌ Erreur lors du téléchargement de la cover ${coverUrl}:`, error);
        return null;
    }
}

export { downloadCover };
