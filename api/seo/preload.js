import fs from 'node:fs';
import path from 'node:path';

/**
 * Préchargement du code de la page demandée.
 *
 * Les routes sont chargées à la demande (`import()` dans le router). Sans aide,
 * la séquence est : HTML → bundle principal → exécution → découverte du chunk de
 * la route → téléchargement. Soit un aller-retour réseau complet ajouté à toutes
 * les pages sauf l'accueil, ce qui pèse lourd sur mobile.
 *
 * Le serveur, lui, sait dès la requête quelle page est demandée. Il peut donc
 * annoncer le chunk correspondant dans le HTML, et le navigateur le télécharge
 * en parallèle du bundle principal au lieu d'attendre.
 */

const DIST = path.resolve(process.cwd(), '../frontend/dist');
const MANIFEST = path.join(DIST, '.vite', 'manifest.json');

/** Composant source de chaque page, tel qu'indexé par le manifeste Vite. */
const PAGE_COMPONENTS = {
    discovery: 'src/components/Features/Discovery/Discovery.vue',
    search: 'src/components/Features/Search/Search.vue',
    pricing: 'src/components/Features/Static/Pricing/Pricing.vue',
    blog: 'src/components/Features/Static/Blog/Blog.vue',
    faq: 'src/components/Features/Static/Faq/Faq.vue',
    status: 'src/components/Features/Static/Status/Status.vue',
    changelog: 'src/components/Features/Static/Changelog/Changelog.vue',
    suggestions: 'src/components/Features/Static/Suggestions/Suggestions.vue',
    supportedSites: 'src/components/Features/Static/SupportedSites/SupportedSites.vue',
    officialPartners: 'src/components/Features/Static/OfficialPartners/OfficialPartners.vue',
    contact: 'src/components/Features/Static/Contact/Contact.vue',
    terms: 'src/components/Features/Static/Terms/Terms.vue',
    privacy: 'src/components/Features/Static/Privacy/Privacy.vue',
    cookies: 'src/components/Features/Static/Cookies/Cookies.vue',
    login: 'src/components/Auth/Login/Login.vue',
    register: 'src/components/Auth/Register/Register.vue',
    profile: 'src/components/Features/User/Profile/Profile.vue',
    library: 'src/components/Features/Mangas/MangasListView/MangasListView.vue',
    notifications: 'src/components/Features/Notifications/NotificationsView.vue',
};

/** Composant des pages œuvre, quelle que soit la nature du média. */
const MEDIA_COMPONENT = 'src/components/Features/Mangas/MangaInfo/MangaInfo.vue';

const manifest = (() => {
    try {
        return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    } catch {
        // Manifeste absent (build sans `manifest: true`, ou dist non compilé) :
        // le préchargement est simplement désactivé, l'application fonctionne.
        return null;
    }
})();

export const preloadAvailable = () => manifest !== null;

/**
 * Balises de préchargement pour une page résolue.
 *
 * @param {{kind: string, pageKey?: string}} resolved  sortie de `resolvePath`
 * @returns {string} balises `<link>` à insérer dans le `<head>`, ou chaîne vide
 */
export function renderPreloads(resolved) {
    if (!manifest) return '';

    const source = resolved.kind === 'media'
        ? MEDIA_COMPONENT
        : resolved.kind === 'page'
            ? PAGE_COMPONENTS[resolved.pageKey]
            : null;

    // L'accueil est dans le bundle principal (importé sans `import()`) : Vite
    // le précharge déjà, il n'y a rien à ajouter.
    if (!source) return '';

    const entry = manifest[source];
    if (!entry) return '';

    const tags = [`<link rel="modulepreload" href="/${entry.file}" crossorigin>`];

    // Le CSS de la page est bloquant au rendu : le charger en parallèle plutôt
    // qu'à la suite évite un flash de contenu non stylé.
    for (const css of entry.css ?? []) {
        tags.push(`<link rel="preload" as="style" href="/${css}">`);
    }

    return tags.join('\n    ');
}
