# API

## Lancer l'api :
Créer un fichier `.env` à la racine du dossier `api` à partir du fichier `.env.example` et remplir les champs.
```
cd api
npm i
node index.js
```

## Rajouter une route :
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

## Lancer le frontend :
Créer un fichier `.env` à la racine du dossier `frontend` à partir du fichier `.env.example` et remplir les champs.
```
cd frontend
npm i
npm run dev
```

## Rajouter une page :
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
