// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.module'

// Import de tes composants existants
import MangasCoverView from '../components/MangasCoverView/MangasCoverView.vue'
import MangaInfo from '../components/MangaInfo/MangaInfo.vue' // nouveau composant
import Login from '../components/Login/Login.vue'
import Register from '../components/Register/Register.vue'
import Home from '../components/Home/Home'


const Profile = () => import("../components/Profile/Profile.vue")
const BoardAdmin = () => import("../components/BoardAdmin/BoardAdmin.vue")
const BoardModerator = () => import("../components/BoardModerator/BoardModerator.vue")
const BoardUser = () => import("../components/BoardUser/BoardUser.vue")

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
    path: '/login',
    name: 'Login',
    component: Login,
    
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    
  },
  {
    path: "/admin",
    name: "admin",
    // lazy-loaded
    component: BoardAdmin,
  },
  {
    path: "/mod",
    name: "moderator",
    // lazy-loaded
    component: BoardModerator,
  },
  {
    path: "/user",
    name: "user",
    // lazy-loaded
    component: BoardUser,
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

router.beforeEach((to, _from, next) => {
  // Only protect restricted pages; keep the rest public
  const protectedPages = ['/profile', '/admin', '/mod', '/user'];
  const requiresAuth = protectedPages.includes(to.path);

  const authStore = useAuthStore();
  const loggedIn = authStore.isLoggedIn;

  if (requiresAuth && !loggedIn) {
    next('/login');
    return;
  }

  // If already logged, avoid showing login/register again
  if (loggedIn && (to.path === '/login' || to.path === '/register')) {
    next('/profile');
    return;
  }

  next();
});

export default router
