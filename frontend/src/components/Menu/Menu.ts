import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'
import Menubar from 'primevue/menubar'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'Menu',
  components: { Menubar },
  setup() {
    const router = useRouter()
    const isShrunk = ref(false)

    const handleScroll = () => {
      isShrunk.value = window.scrollY > 50
    }

    onMounted(() => window.addEventListener('scroll', handleScroll))
    onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))

    const menuItems = [
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
      }
    ]

    return {
      isShrunk,
      menuItems
    }
  }
})
