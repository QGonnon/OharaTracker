import { defineComponent, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import Menubar from 'primevue/menubar'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth.module'
import { icon } from '@fortawesome/fontawesome-svg-core'

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
        { label: 'Dernières sorties', command: () => router.push('/mangas/new') },
        { label: 'Bibliothèque complète', command: () => router.push('/mangas/library') },
        ]
      },
      {
        label: 'Animes',
        items: [
        { label: 'Dernières sorties', command: () => router.push('/animes/new') },
        { label: 'Bibliothèque complète', command: () => router.push('/animes/library') },
        ]
      },
      {
        label: 'Mes suivis',
        items: [
        { label: 'Tous mes suivis', command: () => router.push('/suivis') },
        { separator: true },
        { label: 'Scans', command: () => router.push('/suivis/scans') },
        { label: 'Mangas', command: () => router.push('/suivis/mangas') },
        { label: 'Animes', command: () => router.push('/suivis/animes') },
        ]
      },
      ]
      
      if (isLoggedIn.value) {
      items.push({
        label: 'Mon Compte',
        items: [
        { label: 'Profile', command: () => router.push('/profile') },
        { label: 'Se déconnecter', command: () => {
          authStore.logout()
          return router.push('/login')
        } },
        ]
      })
      }
      
      return items
    })

    return {
      isShrunk,
      menuItems,
      isLoggedIn,
      displayName,
      goLogin,
      personaOpen,
      personaRef,
    }
  }
})
