# Ohara Tracker — Contexte projet

## Résumé
Ohara Tracker est une **Progressive Web App (PWA)** de suivi de médias asiatiques (mangas, animes, webtoons...), pensée comme une alternative multilingue à Kenmei (qui n'existe qu'en anglais). Le projet cible principalement un public européen (15-35 ans) et centralise le suivi de lecture/visionnage, la découverte de contenus et une dimension communautaire, sans jamais héberger de contenu protégé par droit d'auteur (uniquement des métadonnées, avec redirection vers les plateformes légales).

Projet réalisé par le GME **QENOWA** (Noah Darmon, Quentin Gonnon, Wassim Mensi) dans le cadre d'un Mastère ESI à l'école ISITECH.

## Fonctionnalités principales
- **Suivi de séries** : ajout/suppression/mise à jour de séries, synchronisation avec AniList, MyAnimeList, MangaDex, marquage automatique des chapitres/épisodes vus.
- **Notifications** : Web Push (sortie de chapitre, même app fermée), rapport hebdomadaire par e-mail, priorité pour les abonnés premium.
- **Recherche & découverte** : recherche avancée (titre, genre, thème...), recommandations personnalisées, classements/Top 100, "Smart Suggestions".
- **Bibliothèque & profil** : bibliothèque personnelle, historique, notes, import/export de listes, avatar/bannière personnalisables, tags personnalisés, listes de suivi partageables, tableau de bord personnalisable (premium).
- **Communauté** : avis/commentaires, système d'amis, visualisation des bibliothèques d'autres utilisateurs, abonnement à des listes tierces, intégration Discord.
- **Monétisation** : modèle freemium (fonctionnalités premium : filtres sauvegardés, priorité de notifications, jour de réception configurable, etc.).

## Architecture technique

| Besoin | Techno |
|---|---|
| Frontend (PWA) | Vue.js 3 (Vite) + Vue Router + Pinia |
| Style / UI | **Stack mixte hétérogène** : Tailwind CSS 4 + PrimeVue 4 (+ primeicons) **et** Bootstrap 4 + jQuery + Popper.js + FontAwesome en parallèle — dette technique à surveiller |
| Formulaires / i18n | vee-validate + yup (validation), vue-i18n (multilingue), vue3-google-login (Google Identity côté client) |
| Backend / API REST | Node.js + Express |
| Base de données | PostgreSQL |
| ORM | Sequelize (connexion + migrations), mais l'accès aux données dans les routes se fait majoritairement en **SQL brut paramétré** via `sequelize.query(..., { replacements })`, pas via les modèles ORM classiques |
| Authentification | Formulaire classique (bcrypt) + Google OAuth2 côté client (Google Identity Services, PAS Passport malgré la dépendance présente) |
| Sessions | JWT stateless, **access token unique de 24h, pas de refresh token implémenté** |
| Paiement | **Stripe** (checkout, portail client, webhooks) — absent de l'ancienne version de ce document |
| Notifications | Web Push Protocol (VAPID) via `web-push`, réellement implémenté (`api/utils/push.js`, `sw.js` custom côté frontend via vite-plugin-pwa). WebSocket temps réel = roadmap, non implémenté |
| APIs tierces / scraping | AniList, MyAnimeList, MangaDex, **TMDB** (clé `TMDB_API_KEY`), via `puppeteer`/`cheerio` |
| Hébergement | OVH Cloud (conformité RGPD, coûts maîtrisés, scalabilité progressive) |
| Sécurité réseau (réel) | CORS avec whitelist d'origine + `credentials: true`, requêtes SQL paramétrées. **Pas de `helmet`, pas de CSP/HSTS/X-Frame-Options configurés, pas de rate-limiting** — à corriger, voir section Sécurité |
| Emails | DMARC/SPF pour éviter l'usurpation de domaine |
| Versioning / CI-CD | Git/GitHub (branches main / develop / feature-xxx), pipeline basique (tests unitaires, lint, déploiement auto vers l'environnement de test) |
| Environnements | dev local (PostgreSQL local par membre) → test (OVH, isolé) → pré-production (identique prod) → production |

### Choix techniques justifiés (à retenir)
- **Vue.js** plutôt que React : maîtrisé par toute l'équipe, structure de composants plus opinionnée = collaboration facilitée à 3 devs.
- **PostgreSQL** plutôt que MongoDB : les données sont relationnelles par nature (user → bibliothèque → médias → chapitres/tags/genres), gratuité, ACID.
- **Web Push** plutôt que WebSocket pur pour les notifications de sortie : permet d'alerter l'utilisateur même app fermée (le WebSocket reste en roadmap pour un badge temps réel dans l'onglet actif).
- **OVH Cloud** plutôt qu'AWS/GCP/Azure : hébergement européen (RGPD), coûts réduits, montée en charge progressive adaptée à un projet sans levée de fonds.
- **Scraping + APIs tierces (AniList, MyAnimeList, MangaDex, TMDB)** : connecteurs modulaires remplaçables, respect des CGU des plateformes, aucun contenu protégé stocké (métadonnées uniquement).

## Sécurité & conformité RGPD

⚠️ Cette section a été corrigée le 2026-09-08 après audit du code réel — l'ancienne version décrivait des protections non implémentées.

**Réellement en place :**
- Mots de passe hachés en bcrypt, JWT stateless (24h, sans refresh token).
- CORS avec whitelist d'origine.
- Requêtes SQL systématiquement paramétrées (`sequelize.query` + `replacements`) — bon niveau de protection anti-injection SQL.
- `.env` non versionnés, secrets absents du repo.
- Webhook Stripe correctement isolé avec `express.raw` avant `express.json` (nécessaire à la vérification de signature).

**Manquant / à corriger en priorité (constat du 2026-09-08) :**
- **Pas de `helmet`** : aucun header de sécurité (CSP, X-Frame-Options, HSTS, X-Content-Type-Options...) n'est envoyé par l'API.
- **Pas de rate-limiting** (`express-rate-limit` ou équivalent) sur les routes sensibles (signin/signup notamment) → exposé au brute-force.
- **Vérification Google OAuth incomplète** : `api/routes/auth.js` décode le payload du "credential" Google en base64 sans jamais vérifier sa signature cryptographique (pas d'appel à `google-auth-library`/`OAuth2Client.verifyIdToken`). Un attaquant peut forger un JWT-like avec un email arbitraire pour usurper un compte. **Vulnérabilité à corriger en priorité.**
- **Secret JWT avec fallback en dur** : `JWT_SECRET || 'your-secret-key-change-in-production'` dans `api/utils/auth.js` (et dupliqué dans `api/routes/stripe.js`) — si la variable d'env est absente en prod, secret prévisible.
- Pas de validation de schéma centralisée (`joi`/`zod`/`express-validator`) — validations ad hoc minimales (ex: mot de passe ≥ 6 caractères).
- `passport` + `passport-google-oauth20` déclarés en dépendance mais non utilisés — à retirer ou à réellement implémenter.
- HTTPS/TLS : géré au niveau de l'hébergeur OVH (reverse proxy), pas dans le code applicatif.
- RGPD supervisé par Quentin Gonnon : consentement explicite, droit d'accès/suppression via API dédiées, minimisation des données, pas de tracking publicitaire.
- Plan de gestion d'incident : isolation, analyse des logs, correctif, notification sous 72h.

## SEO (non traité dans les versions précédentes de ce document)
- Le frontend est une **SPA pure** (Vue + Vite), sans SSR ni SSG (pas de Nuxt, pas de prerendering).
- `frontend/index.html` n'a qu'un seul jeu de meta tags statiques (title/description fixes) — **pas de title/description dynamiques par route**, pas de balises Open Graph/Twitter Card par page.
- **Pas de `sitemap.xml` ni `robots.txt`** dans `frontend/public/`.
- Pas de `@unhead/vue` ni équivalent pour piloter le `<head>` dynamiquement par route.
- Le manifest PWA (`vite-plugin-pwa`) sert à l'installabilité, pas au SEO.
- Conséquence : référencement naturel très faible en l'état — point à traiter si l'acquisition organique compte pour le projet (SSR/prerendering, meta dynamiques, sitemap, robots.txt, OG tags).

## Structure du repo (aperçu)
- `api/` — backend Node.js/Express : `routes/` (dont `auth.js`, `stripe.js`, `stripeWebhook.js`), `sequelize/` (config/migrations/models PostgreSQL), `utils/` (dont `auth.js`, `push.js`, `database.js`, `cover.js`), `sites/` (connecteurs scraping/APIs tierces : AniList, MAL, MangaDex, TMDB), `app.js`, `index.js`.
- `frontend/` — app Vue.js (Vite) : `src/` (dont `sw.js` service worker custom, `i18n.ts`, `locales/`), `public/`, configs `tsconfig*.json`, `vite.config.ts`.
- `cdn/` — stockage réel de couvertures/images médias (non versionné, `cdn/*` dans `.gitignore`), servi via `express.static`.

## À garder en tête pour l'IA qui travaille sur le code
- Le projet est en JavaScript/TypeScript de bout en bout (Vue + Node/Express).
- L'ORM déclaré côté backend est **Sequelize**, mais le style d'accès aux données dominant dans les routes est du **SQL brut paramétré** via `sequelize.query(..., { replacements })`, pas `Model.findOne()/create()`. Ne pas supposer un style ORM idiomatique partout.
- Toute fonctionnalité liée aux notifications de sortie doit utiliser **Web Push (VAPID)**, pas de WebSocket (non implémenté, réservé à la roadmap).
- Ne jamais stocker/servir de contenu protégé (chapitres/pages de scans) — uniquement métadonnées + redirection vers plateformes légales.
- Respecter la contrainte budget nul : privilégier les solutions open-source/gratuites déjà en place (PostgreSQL, OVH, Tailwind, Web Push natif) plutôt que d'introduire des services tiers payants (ex: éviter Firebase). Stripe est déjà en place pour la partie paiement, c'est une exception assumée du projet.
- La stack UI frontend est hétérogène (Tailwind + PrimeVue + Bootstrap/jQuery) : avant d'ajouter un nouveau composant, vérifier quel framework UI est déjà utilisé dans la page/le module concerné plutôt que d'en introduire un quatrième.
- Priorités sécurité identifiées à date : vérifier cryptographiquement les ID tokens Google (au lieu du simple décodage base64), ajouter `helmet` + rate-limiting sur les routes d'auth, supprimer le fallback JWT_SECRET en dur.
- Priorités SEO identifiées à date : pas de SSR/SSG ni de meta dynamiques ni de sitemap/robots.txt — à considérer si l'acquisition organique est un objectif.
