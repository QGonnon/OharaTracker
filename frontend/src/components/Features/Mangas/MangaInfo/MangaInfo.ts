import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import Menu from '../../../Common/Menu/Menu.vue'
import { slugify } from '../../../../utils'
import { useAuthStore } from '../../../../store/auth.module'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Chip from 'primevue/chip'
import Divider from 'primevue/divider'
import type { Manga } from '../../../../types/index'

export default defineComponent({
  name: 'MangaInfo',
  components: { 
    Menu, 
    Card, 
    Button, 
    Message, 
    Tag, 
    Chip, 
    Divider 
  },

  setup() {
    const route = useRoute()
    const authStore = useAuthStore()
    const manga = ref<Manga>({} as Manga)
    const loading = ref<boolean>(true)
    const error = ref<string | null>(null)
    const adding = ref<boolean>(false)
    const addError = ref<string | null>(null)
    const addSuccess = ref<boolean>(false)
    const isInLibrary = ref<boolean>(false)
    const isLoggedIn = computed(() => authStore.isLoggedIn)

    const coverSrc = computed(() => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      
      if (manga.value.coverPath) {
        return `${apiBase}/cdn/${manga.value.coverPath}`
      }
      if (manga.value.coverUrl) return manga.value.coverUrl
      return `https://picsum.photos/seed/${manga.value.id}/400/300`
    })

    // 🚀 Récupération du manga depuis ton API
    const fetchMangas = async () => {
      loading.value = true
      error.value = null

      try {
        const apiUrl = `${import.meta.env.VITE_API_URL}/chapters`
        const response = await fetch(apiUrl)
        const chapters = (await response.json()) || []

        const mangaList: Manga[] = chapters.map((chapter: any) => ({
          id: chapter.chapterId || chapter.id,
          title: chapter.title || chapter.name,
          author: chapter.author,
          theme: chapter.theme,
          status: chapter.status,
          description: chapter.description,
          coverPath: chapter.coverPath,
          coverUrl: chapter.coverUrl,
          lastChapter: chapter.lastChapter || chapter.chapter,
          chapterUrl: chapter.chapterUrl || chapter.url,
          mangaUrl: chapter.mangaUrl,
          site: chapter.site,
        }))

        // Trouver le manga correspondant à l'URL
        const found = mangaList.find(
          (m) => slugify(m.title) === route.params.name
        )

        if (found) {
          manga.value = found
          if (isLoggedIn.value) {
            await checkLibraryStatus()
          }
        } else {
          manga.value = {} as Manga
          error.value = 'Manga non trouvé.'
        }
      } catch (err) {
        console.error('❌ Erreur lors de la récupération des mangas :', err)
        error.value = 'Erreur de connexion au serveur.'
      } finally {
        loading.value = false
      }
    }

    // 🕓 Chargement initial
    onMounted(fetchMangas)

    // 🔁 Mise à jour si l'URL change
    watch(
      () => route.params.name,
      (newName, oldName) => {
        if (newName !== oldName) fetchMangas()
      }
    )

    watch(
      () => isLoggedIn.value,
      (loggedIn) => {
        if (!loggedIn) {
          isInLibrary.value = false
          addSuccess.value = false
          addError.value = null
          return
        }
        if (manga.value?.title) {
          checkLibraryStatus()
        }
      }
    )

    // 📖 Ouvrir le chapitre
    const openChapter = () => {
      if (manga.value.chapterUrl) {
        window.open(manga.value.chapterUrl, '_blank')
      }
    }

    const checkLibraryStatus = async () => {
      if (!authStore.user?.accessToken || !manga.value?.title) return
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL}/library/status?title=${encodeURIComponent(manga.value.title)}&site=${encodeURIComponent(manga.value.site || 'Unknown')}`
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${authStore.user.accessToken}` }
        })

        if (!response.ok) return
        const data = await response.json()
        isInLibrary.value = Boolean(data?.inLibrary)
        if (isInLibrary.value) {
          addSuccess.value = false
          addError.value = null
        }
      } catch (err) {
        console.error('Erreur vérification bibliothèque', err)
      }
    }

    const addToLibrary = async () => {
      if (!manga.value.id || !authStore.user?.accessToken) return
      addError.value = null
      addSuccess.value = false
      adding.value = true

      try {
        const apiUrl = `${import.meta.env.VITE_API_URL}/library`
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.user.accessToken}`
          },
          body: JSON.stringify({
            title: manga.value.title,
            author: manga.value.author,
            theme: manga.value.theme,
            status: manga.value.status,
            description: manga.value.description,
            coverPath: manga.value.coverPath,
            coverUrl: manga.value.coverUrl,
            lastChapter: manga.value.lastChapter,
            chapterUrl: manga.value.chapterUrl,
            mangaUrl: manga.value.mangaUrl,
            site: manga.value.site || 'Unknown'
          })
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: 'Erreur lors de l\'ajout.' }))
          if (response.status === 409) {
            isInLibrary.value = true
            addError.value = data.message || 'Déjà dans votre bibliothèque.'
            return
          }
          throw new Error(data.message || 'Impossible d\'ajouter ce manga.')
        }

        addSuccess.value = true
        isInLibrary.value = true
      } catch (err: any) {
        addError.value = err?.message || 'Impossible d\'ajouter ce manga.'
      } finally {
        adding.value = false
      }
    }

    return { manga, loading, error, openChapter, coverSrc, isLoggedIn, addToLibrary, adding, addError, addSuccess, isInLibrary }
  }
})
