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

## SEO (refonte complète le 2026-09-08)

L'application reste une SPA Vue/Vite (pas de migration Nuxt), mais tout ce qu'une
SPA ne sait pas faire seule est pris en charge par un middleware Express.

### Architecture SEO
- **URL préfixées par la langue** : `/fr/...`, `/en/...`, `/de/...`, `/it/...`, `/es/...`.
  Avant, les 5 langues partageaient la même URL (bascule via `localStorage`), donc
  4 langues sur 5 étaient inindexables. Les segments sont eux-mêmes traduits
  (`/fr/tarifs`, `/de/preise`, `/es/precios`).
- **Source de vérité unique des URL** : `frontend/src/seo/config.ts`, dupliquée
  côté serveur dans `api/utils/seoRoutes.js`. `npm test` dans `api/` vérifie que
  les deux ne divergent pas.
- **Rendu serveur des métadonnées** : `api/seo/spa.js` sert `frontend/dist` en
  injectant, à chaque requête, le `<title>`, la description, le canonical, les
  hreflang (5 langues + `x-default`), l'Open Graph, la Twitter Card et le JSON-LD
  de la page demandée. Les titres viennent des mêmes fichiers de traduction que
  le frontend (`frontend/src/locales/*.json`, namespace `seo`), donc client et
  serveur ne peuvent pas afficher deux textes différents.
- **Vrais codes HTTP** : 301 vers l'URL canonique (ancien chemin, mauvaise langue,
  mauvais segment de type), 404 réel sur une œuvre inconnue. Le catch-all du
  router ne redirige plus vers `/home` — ce comportement produisait un « soft 404 »
  sur chaque URL morte.
- **Côté client** : `@unhead/vue` + `frontend/src/seo/useSeo.ts` reposent les mêmes
  balises à chaque navigation ; `usePageSeo(pageKey)` couvre les pages fixes en une ligne.
- **Données structurées** (`frontend/src/seo/jsonld.ts` et `api/seo/spa.js`) :
  Organization, WebSite + SearchAction, WebApplication, BreadcrumbList,
  ComicSeries/TVSeries/Movie par œuvre, CollectionPage sur la découverte,
  FAQPage et Product/Offer sur les tarifs.
- **`robots.txt` et `sitemap.xml` générés dynamiquement** (`api/routes/seo.js`),
  servis à la racine du domaine. Le sitemap est un index : pages fixes + œuvres
  découpées en fichiers, chaque URL portant ses alternates hreflang. Hors
  production, `robots.txt` interdit tout le crawl (protège la préprod).
- **Espaces privés en `noindex`** (connexion, inscription, profil, bibliothèque,
  notifications) et exclus du sitemap.

### Performance (Core Web Vitals)
- Nouveaux endpoints `GET /chapters/light` (catalogue sans les chapitres) et
  `GET /chapters/slug/:slug` (une œuvre). Auparavant la fiche d'une œuvre
  téléchargeait *tout* le catalogue avec les chapitres de toutes les sources.
- Routes chargées à la demande (`import()`) : le bundle initial passe d'environ
  1,25 Mo à environ 0,75 Mo.
- Imports PrimeVue profonds (`primevue/button`) au lieu du barrel `primevue`.
- `compression` (gzip/brotli) sur l'API, `Cache-Control` long sur `/cdn` et les
  assets versionnés, `preconnect` vers l'origine de l'API.
- Dépendances `bootstrap`, `jquery` et `popper.js` supprimées : déclarées mais
  jamais importées.

### Slugs
`slugify` rabat les accents sur la lettre de base et conserve le CJK, au lieu de
supprimer tout caractère non-ASCII (`Ōkami` donnait `kami`, un titre japonais
donnait une chaîne vide). L'ancienne forme reste acceptée en entrée pour ne pas
casser les liens partagés, et redirige en 301 vers la nouvelle.
Les implémentations client (`frontend/src/utils.ts`) et serveur
(`api/utils/slug.js`) doivent rester identiques — c'est testé.

### Images de partage
`npm run og:image` (dans `frontend/`) génère `public/og-default-<langue>.png`
en 1200×630, une par langue, à partir de `scripts/generate-og-image.mjs`.
À relancer après toute modification du logo ou des accroches.

## Accessibilité (RGAA / WCAG 2.1 AA — refonte le 2026-09-08)

Audit complet puis correction de 42 problèmes (10 bloquants, 19 majeurs, 13 mineurs).
Score Lighthouse Accessibilité : **100/100** sur toutes les pages testées.

Principaux correctifs :
- **Lien d'évitement + `<main>`** dans `App.vue` : la navigation n'a plus à être
  retraversée à chaque page au clavier.
- **Éléments cliquables non focusables** : les cartes de résultats de recherche,
  de la bibliothèque et les notifications n'étaient atteignables qu'à la souris —
  ces écrans étaient donc inutilisables au clavier.
- **Formulaires** : les `<label for>` de connexion/inscription pointaient dans le
  vide (vee-validate ne pose pas d'`id`), ceux du profil et du dialogue d'édition
  n'avaient pas de `for` du tout. Les erreurs sont maintenant reliées au champ
  (`aria-describedby`) et annoncées (`role="alert"`).
- **Boutons sans nom** : le menu hamburger, la cloche de notifications et tous les
  boutons à icône seule (le glyphe PrimeIcons est un caractère de zone privée
  Unicode, muet pour un lecteur d'écran).
- **Contrastes** : ~80 occurrences corrigées, y compris des surcharges du thème
  PrimeVue (`.p-accordionheader`, boutons secondaires) mesurées à 4,3-4,4:1.
- **Lightbox** : `role="dialog"`, fermeture à Échap, focus déplacé puis restitué.
- **Deux `<h1>` par page** (le logo du menu en était un) et sauts de niveau.
- **`prefers-reduced-motion`** respecté globalement (`assets/styles.scss`).
- **Textes en dur en français** sur un site en 5 langues (alt des captures,
  statuts du mockup d'accueil).

`npm run check:a11y` (dans `frontend/`) rejoue un garde-fou anti-régression sur
tous ces points ; il est branché en amont de `npm run build`, donc une régression
bloque la compilation.

## Sécurité HTTP et performance (2026-09-08)

### En-têtes (`api/seo/security.js`)
- `helmet` avec une **CSP stricte** : pas d'`unsafe-inline` sur `script-src`, un
  **nonce par requête** pour les blocs JSON-LD (sans lui, Chrome les bloque et
  les rich results disparaissent), `frame-ancestors 'none'`, `object-src 'none'`.
- HSTS et `upgrade-insecure-requests` uniquement en production (les activer en
  local bloquerait `http://localhost` dans le navigateur du développeur).
- `express-rate-limit` : 10 tentatives/15 min sur `/auth/signin`, `/auth/signup`,
  `/auth/google` et `/auth/change-password` ; 600 req/15 min sur le reste.
- ⚠️ **`PUBLIC_API_URL` doit valoir exactement `VITE_API_URL`.** Si l'API est
  servie depuis une autre origine que le site, l'omettre fait bloquer toutes les
  requêtes de données par la CSP : l'application s'affiche mais reste vide, sans
  aucune erreur côté serveur. Un test couvre ce cas.

### ⚠️ Comment mesurer avec Lighthouse (lire avant tout audit)

Trois pièges, dans l'ordre où on les rencontre. Les trois donnent un score
Performance/SEO/Bonnes pratiques bas **sans qu'il y ait de bug dans le code**.

**Piège 1 — tester `localhost:5173` au lieu de `localhost:3000`.**
`5173` est le serveur de dev Vite : rien n'y est minifié ni découpé (le seul
paquet FontAwesome y pèse 955 Ko contre quelques Ko en prod), et surtout
**aucun en-tête de sécurité ni `robots.txt` n'y est servi** — ils viennent du
middleware Express (`api/`), absent de Vite. Score typique : 61/90/96/92 sur
Vite contre 100/100/100/100 sur la vraie stack. → **Toujours tester via l'API
(port 3000), jamais via Vite seul.**

**Piège 2 — `NODE_ENV=development` bloque tout le crawl, donc le score SEO.**
`api/routes/seo.js` fait exprès de renvoyer `Disallow: /` dans `robots.txt`
quand `NODE_ENV !== 'production'` — protection pour qu'une préprod mal
configurée ne se retrouve jamais indexée par accident. Effet de bord : si votre
`.env` local a `NODE_ENV=development` (le réglage normal en dev), l'audit
Lighthouse SEO chute autour de **69**, à cause d'un seul critère (« Page is
blocked from indexing ») — tout le reste (Performance, Accessibilité, Bonnes
pratiques) reste inchangé. **Ce n'est pas un bug** : c'est la même protection
qui s'applique, que vous testiez en local ou en préprod. Pour mesurer le vrai
score SEO, il faut temporairement (ou durablement, voir piège 3)
`NODE_ENV=production` dans `api/.env`.

**Piège 3 — passer en `NODE_ENV=production` active HSTS.**
Avec `NODE_ENV=production`, `api/seo/security.js` envoie l'en-tête
`Strict-Transport-Security`. Si vous testez ensuite `http://localhost:3000`
dans votre **vrai navigateur** (pas en Lighthouse headless), celui-ci peut
mémoriser « ce domaine doit toujours être en HTTPS » pendant un an, et refuser
ensuite de recharger la version HTTP en clair. Pour nettoyer si ça arrive :
`edge://net-internals/#hsts` (ou `chrome://net-internals/#hsts`) → « Delete
domain security policies » → taper `localhost` → Delete.

**Procédure correcte, à chaque fois :**
```
cd frontend && npm run build
cd ../api
# NODE_ENV=development dans .env est le réglage normal du dépôt (dev quotidien).
# Pour un audit Lighthouse dont le score SEO doit refléter la réalité,
# passer temporairement NODE_ENV=production dans api/.env avant de lancer :
node index.js
# auditer http://localhost:3000/fr, puis remettre NODE_ENV=development
# dans .env avant de committer/pusher quoi que ce soit.
```
`api/.env` est ignoré par git (`api/.gitignore`) : cette bascule ne part
jamais dans un commit, mais gardez `development` au quotidien pour ne pas
tomber sur le piège 3 sans le vouloir.

### Résultats Lighthouse mesurés (build de production)

| Contexte | Performance | Accessibilité | Bonnes pratiques | SEO |
|---|---|---|---|---|
| Ordinateur | **100** | **100** | **100** | **100** |
| Mobile | 83-85 | **100** | **100** | **100** |

Les 83-85 en mobile correspondent au simulateur de Lighthouse (4G lente + CPU
quatre fois ralenti) appliqué à une SPA Vue + PrimeVue : c'est le plafond
réaliste sans passer au rendu serveur complet. Les Core Web Vitals réelles sont
bonnes (CLS 0, LCP ~3 s en 4G simulée).

### Résultats mesurés précédemment (mobile, throttling par défaut)
| Page | Perf | A11y | Bonnes pratiques | SEO |
|---|---|---|---|---|
| `/fr` | 79 | 100 | 100 | 100 |
| `/fr/tarifs` | 80 | 100 | 100 | 100 |
| `/fr/confidentialite` | 84 | 100 | 100 | 100 |
| `/fr/decouverte` | 84 | 100 | 100 | 100 |
| `/de` | 80 | 100 | 100 | 100 |

Les pages de compte (`/en/register`…) affichent un SEO à 63 : c'est **voulu**,
Lighthouse pénalise le `noindex` que l'on pose délibérément.

### Correctifs de performance décisifs
- **CLS de 0,678 → 0** : le pied de page remontait tant que le chunk de la route
  n'était pas chargé, puis redescendait d'un coup. `#main-content { min-height:
  100vh }` réserve la place. À lui seul, ce correctif a fait passer les pages
  secondaires de 58-63 à 80-84.
- **Préchargement du chunk de la route** (`api/seo/preload.js`) : le serveur sait
  quelle page est demandée, il annonce son chunk dans le HTML au lieu de laisser
  le navigateur le découvrir après exécution du bundle principal. Nécessite
  `build.manifest: true` côté Vite.
- `compression` (gzip) sur l'API : sans elle, le score tombe de 79 à 60.
- **Traductions chargées à la demande** : les cinq fichiers de locale étaient
  importés statiquement, soit 144 Ko de JSON dans le paquet initial alors qu'un
  visiteur n'en lit qu'un. `import.meta.glob` dans `src/i18n.ts` en fait des
  chunks séparés ; le paquet initial passe de 604 à 496 Ko. `main.ts` attend la
  langue avant de monter et le garde du router avant chaque navigation, pour ne
  jamais afficher de clés brutes.
- **Captures d'écran de l'accueil réduites** : 1076-1261 px pour un affichage
  entre 175 et 350 px, soit 266 Ko téléchargés pour rien.
  `npm run optimize:screenshots` régénère les `*-preview.webp` en 760 px
  (407 Ko → 141 Ko). Les originales restent dans le dépôt comme sources.
- Source maps de production activées.

### Piste écartée (mesurée, sans gain)
Intégrer la feuille de style principale dans le HTML pour supprimer la requête
bloquante : Lighthouse annonçait 300 ms de gain, la mesure réelle a donné 0
(les 18 Ko gzippés ajoutés au HTML annulent l'aller-retour économisé). Écarté,
car cela aurait en plus supprimé la mise en cache du CSS.

### Pièges connus
- Le middleware SPA met `index.html` en cache au démarrage en production :
  **redémarrer l'API après chaque `npm run build` du frontend**, sinon elle sert
  un HTML qui référence des fichiers supprimés (page blanche).
- Le score de performance reste limité par le JavaScript inutilisé (~300 ms) :
  PrimeVue et son thème sont chargés en entier au démarrage. Levier restant si
  besoin, mais coûteux.

### Page FAQ dédiée (ajoutée le 2026-09-08)
La FAQ vivait uniquement en bas de la page tarifs. Elle a désormais son URL
(`/fr/faq`, `/de/faq`…), listée dans le sitemap et liée depuis le footer
au-dessus du blog. Intérêt : elle cible les requêtes formulées en question
(« comment annuler mon abonnement »), porte seule son balisage `FAQPage` — la
configuration attendue par Google pour les questions dépliables dans les
résultats — et ajoute un lien interne vers les tarifs et le contact.
Le bloc FAQ de la page tarifs est conservé : le contenu vient des mêmes clés
`faq.items`, il n'y a donc rien à maintenir en double.

### Reste à faire
- La page `/blog` est une coquille vide : c'est le principal levier de trafic
  organique encore inexploité.
- Déclarer le site et soumettre le sitemap à la Google Search Console.

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
- **Ne jamais construire une URL à la main.** Passer par `localePath()`, `localeHome()`
  ou `localeMedia()` (`frontend/src/seo/localePath.ts`) : un chemin en dur comme
  `/pricing` déclenche une redirection et casse le lien entre langue et URL.
- Toute nouvelle page doit : être déclarée dans `PAGE_SEGMENTS` des **deux**
  fichiers de config SEO, appeler `usePageSeo('saCle')`, et avoir ses textes
  `seo.saCle.title` / `seo.saCle.description` dans les **5** fichiers de locale.
  `npm test` dans `api/` échoue si la configuration est incohérente.
- Les écrans de listing utilisent `mangaStore.fetchLight()` (catalogue allégé) ;
  `fetchAll()` ne doit servir que si les chapitres sont réellement nécessaires.

## Déploiement (question ouverte)
Le rendu serveur suppose que l'API sert `frontend/dist` (c'est ce que fait
`node index.js` en local, et c'est le mode testé). Si un jour le frontend est
servi séparément par un reverse proxy (nginx sur OVH, par exemple), il faudra
soit router tout le trafic HTML vers l'API, soit proxifier au minimum
`/robots.txt` et `/sitemap*.xml` vers elle — sinon ils sont introuvables à la
racine du domaine public. À traiter le jour où cette configuration est décidée.