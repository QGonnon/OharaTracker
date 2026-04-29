import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Button, Drawer } from 'primevue'
import PopupMenu from 'primevue/menu'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../store/auth.module'
import type { MenuItem } from 'primevue/menuitem'

export default defineComponent({
  name: 'AppMenu',
  components: { Button, Drawer, PopupMenu },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const isShrunk = ref(false)
    const mobileOpen = ref(false)
    const userMenuRef = ref()

    const handleScroll = () => { isShrunk.value = window.scrollY > 50 }
    onMounted(() => window.addEventListener('scroll', handleScroll))
    onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))

    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const name = computed(() =>
      authStore.currentUser?.name || ''
    )

    const goLogin = () => router.push({ name: 'Login' })

    const handleLogout = () => {
      authStore.logout()
      router.push({ name: 'Login' })
    }

    const theme = ref(document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light')
    const toggleTheme = () => {
      if (theme.value === 'dark') {
        theme.value = 'light'
        document.documentElement.classList.remove('dark-theme')
        try { localStorage.setItem('theme', 'light') } catch (e) {}
      } else {
        theme.value = 'dark'
        document.documentElement.classList.add('dark-theme')
        try { localStorage.setItem('theme', 'dark') } catch (e) {}
      }
    }

    const isActive = (name: string) => route.name === name

    const navLinks = [
      { label: 'Découverte', name: 'Découverte', to: '/discovery', icon: 'pi pi-compass' },
      { label: 'Bibliothèque', name: 'Search', to: '/search', icon: 'pi pi-book' },
      { label: 'Mes Suivis', name: 'Mes Suivis', to: '/list', icon: 'pi pi-star'},
    ]

    const toggleUserMenu = (event: Event) => {
      userMenuRef.value?.toggle(event)
    }

    const userMenuItems = computed<MenuItem[]>(() => [
      { label: 'Mon profil', icon: 'pi pi-user', command: () => router.push({ name: 'Profile' }) },
      { separator: true },
      { label: 'Se déconnecter', icon: 'pi pi-sign-out', command: handleLogout },
    ])

    return {
      isShrunk,
      mobileOpen,
      userMenuRef,
      isLoggedIn,
      name,
      goLogin,
      handleLogout,
      theme,
      toggleTheme,
      isActive,
      navLinks,
      toggleUserMenu,
      userMenuItems,
    }
  },
})
