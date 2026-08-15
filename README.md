# Installation

### Logiciel requis :
- Node.js (version 24.12)
- PostgreSQL (version 18.4)
- Dbeaver (optionnel, pour visualiser la base de données)
- Stripe CLI (installer globalement avec la commande `npm install --global @stripe/cli`)

### Créer les fichiers de configuration :
Dans api :
- Créer un fichier `.env` à la racine du dossier `api` à partir du fichier `.env.example` et remplir les champs.
- Créer un fichier `config.json` dans le dossier `api/sequilize/config` à partir du fichier `config.json.example`.

Dans frontend :
- Créer un fichier `.env` à la racine du dossier `frontend` à partir du fichier `.env.example` et remplir les champs.

### Initialiser le projet :
```
cd api
npm i
npm run init
cd ../frontend
npm i
```

### Débugage :
- Si npm run dev ne fonctionne pas dans api, exécuter la commande `stripe listen --forward-to localhost:3000/stripe/webhook` pour verifier que l'API keys valable 3 mois a été généré.

# API

### Lancer l'api :
```
cd api
npm run dev
```

### Rajouter une route :
1. Créer un fichier dans le dossier `routes` avec pour nom le nom de la route (ex: `chapitres.js`)
2. Ajouter le code suivant dans le fichier :
```javascript
import express from 'express';
const router = express.Router();

// code de la route. ex:
router.get('/', (req, res) => {
    res.send('Hello World!');
});

export default router;
```
3. Ajouter l'import du fichier dans le fichier `index.js` du dossier `routes` (ex: `import chapitres from './chapitres.js';`)
4. Ajouter la route dans le fichier `index.js` du dossier `routes` (ex: `router.use('/chapters', chapitres);`)


# Frontend

### Lancer le frontend :
```
cd frontend
npm run dev
```

### Rajouter une page :
1. Créer un nouveau dossier dans le dossier `components` avec pour nom le nom de la page (ex: `NomComposant`)
2. Créer un fichier `NomComposant.vue` dans le dossier créé
3. Ajouter le code suivant dans le fichier :
```html
<template>
    <!-- contenu de la page html -->
</template>

<script src="./NomComposant.ts"></script>

<style>
    @import './NomComposant.css';
</style>
```
4. Créer un fichier `NomComposant.css` dans le dossier créé
5. Créer un fichier `NomComposant.ts` dans le dossier créé
6. Ajouter le code suivant dans le fichier :
```typescript
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'NomComposant',
    setup() {
        // code de la page
    }
});
```
