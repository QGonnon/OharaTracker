import { defineComponent, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import Menubar from 'primevue/menubar'
import { useRouter, type NavigationFailure } from 'vue-router'
import { useAuthStore } from '../../../store/auth.module'
import type { MenuItem } from 'primevue/menuitem'

export default defineComponent({
  name: 'Menu',
  components: { Menubar },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const isShrunk = ref(false)
    const personaOpen = ref(false)
    const personaRef = ref<HTMLElement | null>(null)

    const handleScroll = () => {
      isShrunk.value = window.scrollY > 50
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (personaRef.value && !personaRef.value.contains(event.target as Node)) {
        personaOpen.value = false
      }
    }

    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
      window.addEventListener('mousedown', handleClickOutside)
    })
    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousedown', handleClickOutside)
    })

    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const displayName = computed(() => authStore.currentUser?.displayName || authStore.currentUser?.username || authStore.currentUser?.name || '')
    
    const goLogin = () => router.push({ name: 'Login' })

    const handleLogout = async () => {
      await authStore.logout()
      router.push({ name: 'Login' })
    }

    // Theme handling (persisted in localStorage). Uses the `.dark-theme` root class.
    const theme = ref(document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light')

    const toggleTheme = () => {
      if (theme.value === 'dark') {
        theme.value = 'light'
        document.documentElement.classList.remove('dark-theme')
        try { localStorage.setItem('theme', 'light') } catch (e) { }
      } else {
        theme.value = 'dark'
        document.documentElement.classList.add('dark-theme')
        try { localStorage.setItem('theme', 'dark') } catch (e) { }
      }
    }

    const menuItems:MenuItem[] =  [
      {
        label: 'Dernière sorties', command: () => router.push({ name: 'Home' })
      },
      { label: 'Bibliothèque', command: () => router.push({ name: 'Search' }) },
      {
        label: displayName.value,
        visible: isLoggedIn.value,
        items: [
          { label: 'Mon profil', command: () => router.push({ name: 'Profile' }) },
          { label: 'Mes Suivis', command: () => router.push({ name: 'Library' }) },
          { label: 'Se déconnecter', command: handleLogout },
        ]
      }
    ]

    return {
      menuItems,
      isLoggedIn,
      goLogin,
      isShrunk,
      theme,
      toggleTheme,
    }
  },
})
