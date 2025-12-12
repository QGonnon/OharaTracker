// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.module'

// Import de tes composants existants
import MangasCoverView from '../components/Features/Mangas/MangasCoverView/MangasCoverView.vue'
import MangaInfo from '../components/Features/Mangas/MangaInfo/MangaInfo.vue'
import Login from '../components/Auth/Login/Login.vue'
import Register from '../components/Auth/Register/Register.vue'
import Home from '../components/Features/Home/Home'
import MangasListView from '../components/Features/Mangas/MangasListView/MangasListView.vue'


const Profile = () => import("../components/Features/User/Profile/Profile.vue")
const BoardAdmin = () => import("../components/Features/User/BoardAdmin/BoardAdmin.vue")
const BoardModerator = () => import("../components/Features/User/BoardModerator/BoardModerator.vue")
const BoardUser = () => import("../components/Features/User/BoardUser/BoardUser.vue")

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
    props: true,
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
    path: '/list',
    name: 'Library',
    component: MangasListView,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    
  },
  {
    path: "/admin",
    name: "admin",
    component: BoardAdmin,
  },
  {
    path: "/mod",
    name: "moderator",
    component: BoardModerator,
  },
  {
    path: "/user",
    name: "user",
    component: BoardUser,
  },
  {
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
  protectedPages.push('/list');
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
