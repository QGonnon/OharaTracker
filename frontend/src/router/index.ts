// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MangaList from "../components/MangaList/MangaList.vue";

const routes = [
  {
    path: '/',
    name: 'Sorties',
    component: MangaList
  },
//   {
//     path: '/about',
//     name: 'About',
//     component: About
//   }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
