import { defineComponent, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import Menubar from 'primevue/menubar'
import { useRouter, type NavigationFailure } from 'vue-router'
import { useAuthStore } from '../../../store/auth.module'

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
    
    const goLogin = () => router.push('/login')

    const handleLogout = async () => {
      await authStore.logout()
      router.push('/')
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

    const menuItems = computed(() => {
      const items = [
        {
          label: 'Scans',
          items: [
            { label: 'Dernières sorties', command: () => router.push('/scans/new') },
            { label: 'Bibliothèque complète', command: () => router.push('/scans/library') },
          ]
        },
        {
          label: 'Mangas',
          items: [
            { label: 'Derniers chapitres', command: () => router.push('/new') },
            { label: 'Ma bibliothèque', command: () => router.push('/list') },
            { label: 'Recherche', command: () => router.push('/search') },
          ]
        },
      ]

      if (isLoggedIn.value) {
        items.push({
          label: displayName.value,
          items: [
            { label: 'Mon profil', command: () => router.push('/profile') },
            isLoggedIn.value && authStore.currentUser?.role === 'moderator' ? { label: 'Modération', command: () => router.push('/moderator') } : null,
            isLoggedIn.value && authStore.currentUser?.role === 'admin' ? { label: 'Administration', command: () => router.push('/admin') } : null,
            { label: 'Se déconnecter', command: handleLogout },
          ].filter((item): item is { label: string; command: () => Promise<void | NavigationFailure | undefined> } => item !== null)
        })
      }

      return items
    })

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
