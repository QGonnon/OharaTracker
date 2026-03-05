// src/router/index.js
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../store/auth.module'

// Import de tes composants existants
import MangasCoverView from '../components/Features/Mangas/MangasCoverView/MangasCoverView.vue'
import MangaInfo from '../components/Features/Mangas/MangaInfo/MangaInfo.vue'
import Login from '../components/Auth/Login/Login.vue'
import Register from '../components/Auth/Register/Register.vue'
import Home from '../components/Features/Home/Home.vue'
import Discovery from '../components/Features/Discovery/Discovery.vue'
import MangasListView from '../components/Features/Mangas/MangasListView/MangasListView.vue'
import Search from '../components/Features/Search/Search.vue'
import Profile from '../components/Features/User/Profile/Profile.vue'

// const BoardAdmin = () => import("../components/Features/User/BoardAdmin/BoardAdmin.vue")
// const BoardModerator = () => import("../components/Features/User/BoardModerator/BoardModerator.vue")
// const BoardUser = () => import("../components/Features/User/BoardUser/BoardUser.vue")

const routes: RouteRecordRaw[] = [
  {
    path: '/discovery',
    name: 'Découverte',
    component: Discovery,
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
  },
  {
    path: '/new',
    name: 'Nouveautés',
    component: MangasCoverView,
  },
  {
    path: '/search',
    name: 'Search',
    component: Search,
  },
  {
    path: '/manga/:name',
    name: 'MangaInfo',
    component: MangaInfo,
    props: true,
    
  },
  {
    path: '/anime/:name',
    name: 'AnimeInfo',
    component: MangaInfo,
    props: true,
  },
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        name: 'Login',
        component: Login,
      },
      {
        path: '/register',
        name: 'Register',
        component: Register,
      },
    ]
  },
  {
    path: '/user',
    children: [
      {
        path: '/profile',
        name: 'Profile',
        component: Profile,
      },
      {
        path: '/list',
        name: 'Library',
        component: MangasListView,
      },
    ]
  },
  // {
  //   path: "/admin",
  //   name: "admin",
  //   component: BoardAdmin,
  // },
  // {
  //   path: "/mod",
  //   name: "moderator",
  //   component: BoardModerator,
  // },
  // {
  //   path: "/user",
  //   name: "user",
  //   component: BoardUser,
  // },
  {
    path: '/:pathMatch(.*)',
    redirect: '/home',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  // Only protect restricted pages; keep the rest public
  const protectedPages = [
    'Profile', 
    'Admin', 
    'Moderator', 
    'User', 
    'Library'
  ];
  const requiresAuth = protectedPages.includes(to.name?.toString() || '');

  const authStore = useAuthStore();
  const loggedIn = authStore.isLoggedIn;

  if (requiresAuth && !loggedIn) {
    next('/auth/login');
    return;
  }

  // If already logged, avoid showing login/register again
  if (loggedIn && (to.name === 'Login' || to.name === 'Register')) {
    next('/auth/profile');
    return;
  }

  next();
});

export default router
