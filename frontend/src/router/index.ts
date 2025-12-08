// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// Import de tes composants existants
import MangasCoverView from '../components/MangasCoverView/MangasCoverView.vue'
import MangaInfo from '../components/MangaInfo/MangaInfo.vue' // nouveau composant

const routes = [
  {
    path: '/',
    name: 'Accueil',
    component: MangasCoverView,
  },
  {
    path: '/manga/:name',
    name: 'MangaInfo',
    component: MangaInfo,
    props: true, // permet de récupérer "name" dans le composant via props ou useRoute()
  },
  {
    // route facultative : page 404 si le manga n’existe pas
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      template: `
        <div style="text-align:center; padding:2rem;">
          <h2>404 - Page non trouvée</h2>
          <p>Le manga demandé n'existe pas.</p>
          <router-link to="/">⬅️ Retour à l'accueil</router-link>
        </div>
      `,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
