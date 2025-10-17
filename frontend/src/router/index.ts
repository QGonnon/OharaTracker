// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MangasListView from "../components/MangasListView/MangasListView.vue";
import MangasCoverView from "../components/MangasCoverView/MangasCoverView.vue";

const routes = [
  {
    path: '/',
    name: 'Accueil',
    component: MangasCoverView
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
