// src/router/index.js
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../store/auth.module'

// Import de tes composants existants
import MangaInfo from '../components/Features/Mangas/MangaInfo/MangaInfo.vue'
import Login from '../components/Auth/Login/Login.vue'
import Register from '../components/Auth/Register/Register.vue'
import Home from '../components/Features/Home/Home.vue'
import Discovery from '../components/Features/Discovery/Discovery.vue'
import MangasListView from '../components/Features/Mangas/MangasListView/MangasListView.vue'
import Search from '../components/Features/Search/Search.vue'
import Profile from '../components/Features/User/Profile/Profile.vue'
import NotificationsView from '../components/Features/Notifications/NotificationsView.vue'

// Pages statiques / footer
import Pricing from '../components/Features/Static/Pricing/Pricing.vue'
import Blog from '../components/Features/Static/Blog/Blog.vue'
import Status from '../components/Features/Static/Status/Status.vue'
import Changelog from '../components/Features/Static/Changelog/Changelog.vue'
import Suggestions from '../components/Features/Static/Suggestions/Suggestions.vue'
import SupportedSites from '../components/Features/Static/SupportedSites/SupportedSites.vue'
import OfficialPartners from '../components/Features/Static/OfficialPartners/OfficialPartners.vue'
import Contact from '../components/Features/Static/Contact/Contact.vue'
import Terms from '../components/Features/Static/Terms/Terms.vue'
import Privacy from '../components/Features/Static/Privacy/Privacy.vue'
import Cookies from '../components/Features/Static/Cookies/Cookies.vue'

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
  /* {
    path: '/new',
    name: 'Nouveautés',
    component: MangasCoverView,
  }, */
  {
    path: '/search',
    name: 'Search',
    component: Search,
  },
  {
    path: '/lecture/:name',
    name: 'LectureInfo',
    component: MangaInfo,
    props: true,
  },
  {
    path: '/serie/:name',
    name: 'SerieInfo',
    component: MangaInfo,
    props: true,
  },
  {
    path: '/film/:name',
    name: 'FilmInfo',
    component: MangaInfo,
    props: true,
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
  {
    path: '/notifications',
    name: 'Notifications',
    component: NotificationsView,
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: Pricing,
  },
  {
    path: '/blog',
    name: 'Blog',
    component: Blog,
  },
  {
    path: '/status',
    name: 'Status',
    component: Status,
  },
  {
    path: '/changelog',
    name: 'Changelog',
    component: Changelog,
  },
  {
    path: '/suggestions',
    name: 'Suggestions',
    component: Suggestions,
  },
  {
    path: '/supported-sites',
    name: 'SupportedSites',
    component: SupportedSites,
  },
  {
    path: '/official-partners',
    name: 'OfficialPartners',
    component: OfficialPartners,
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact,
  },
  {
    path: '/terms',
    name: 'Terms',
    component: Terms,
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: Privacy,
  },
  {
    path: '/cookies',
    name: 'Cookies',
    component: Cookies,
  },
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
  const protectedPages = ['Profile', 'Admin', 'Moderator', 'User', 'Library', 'Notifications'];
  const requiresAuth = protectedPages.includes(to.name?.toString() || '');
  const authStore = useAuthStore();
  const loggedIn = authStore.isLoggedIn;

  if (requiresAuth && !loggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  // Ne plus bloquer ici - laisser Login.ts gérer la redirection post-login
  if (loggedIn && (to.name === 'Login' || to.name === 'Register')) {
    const redirect = to.query.redirect as string;
    if (redirect && redirect !== '/auth/login' && redirect !== '/register') {
      next(redirect);
    } else {
      next({ name: 'Profile' });
    }
    return;
  }

  next();
});

export default router