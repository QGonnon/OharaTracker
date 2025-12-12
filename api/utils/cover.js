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

    await fs.mkdir(CDN_DIR, { recursive: true });
    const targetPath = path.join(CDN_DIR, coverFileName);

    try {
        await fs.access(targetPath);
        return coverFileName; // Déjà présent
    } catch (_) {
        // continue pour télécharger
    }

    try {
        const response = await fetch(coverUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(targetPath, buffer);
        return coverFileName;
    } catch (error) {
        console.error(`❌ Erreur lors du téléchargement de la cover ${coverUrl}:`, error);
        return null;
    }
}

export { downloadCover };
