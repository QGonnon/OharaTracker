import fs from 'node:fs';
import path from 'node:path';

// Le serveur connaît la page dès la requête et peut annoncer son chunk dans le HTML,
// pour que le navigateur le télécharge en parallèle du bundle principal.
const DIST = path.resolve(process.cwd(), '../frontend/dist');
const MANIFEST = path.join(DIST, '.vite', 'manifest.json');

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

const MEDIA_COMPONENT = 'src/components/Features/Mangas/MangaInfo/MangaInfo.vue';

const manifest = (() => {
    try {
        return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    } catch {
        return null; // manifeste absent : préchargement désactivé, l'app fonctionne quand même
    }
})();

export const preloadAvailable = () => manifest !== null;

export function renderPreloads(resolved) {
    if (!manifest) return '';

    const source = resolved.kind === 'media'
        ? MEDIA_COMPONENT
        : resolved.kind === 'page'
            ? PAGE_COMPONENTS[resolved.pageKey]
            : null;

    // L'accueil est dans le bundle principal : Vite le précharge déjà.
    if (!source) return '';

    const entry = manifest[source];
    if (!entry) return '';

    const tags = [`<link rel="modulepreload" href="/${entry.file}" crossorigin>`];

    for (const css of entry.css ?? []) {
        tags.push(`<link rel="preload" as="style" href="/${css}">`);
    }

    return tags.join('\n    ');
}
