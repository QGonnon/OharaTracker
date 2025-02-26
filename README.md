# API

## Lancer l'api :
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
