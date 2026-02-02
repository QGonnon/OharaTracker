import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
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
import EditLibraryDialog from '../../../Shared/EditLibraryDialog/EditLibraryDialog.vue'
import type { Manga } from '../../../../types/index'

export default defineComponent({
  name: 'AnimeInfo',
  components: { 
    Menu,
    Card,
    Button,
    Message,
    Tag,
    Chip,
    Divider,
    EditLibraryDialog
  },

  setup() {
  const route = useRoute()
  const router = useRouter()
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
      const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
      
      if (manga.value.coverPath) {
        return `${apiBase}/cdn/${manga.value.coverPath}`
      }
      if (manga.value.coverUrl) return manga.value.coverUrl
      return `https://picsum.photos/seed/${manga.value.id}/400/300`
    })

    // Sanitize description HTML to avoid executing scripts or inline handlers
    const sanitizeHtml = (dirty: string) => {
      if (!dirty) return ''
      try {
        const container = document.createElement('div')
        container.innerHTML = dirty

        // Remove script/style tags
        container.querySelectorAll('script, style').forEach(n => n.remove())

        // Remove dangerous attributes from all elements
        const nodes = container.querySelectorAll('*')
        nodes.forEach(node => {
          Array.from(node.attributes).forEach(attr => {
            const name = attr.name.toLowerCase()
            const value = attr.value || ''
            if (name.startsWith('on')) {
              node.removeAttribute(attr.name)
            }
            if ((name === 'href' || name === 'src') && value.trim().toLowerCase().startsWith('javascript:')) {
              node.removeAttribute(attr.name)
            }
            if (name === 'style') {
              node.removeAttribute(attr.name)
            }
          })
        })

        return container.innerHTML
      } catch (e) {
        return ''
      }
    }

    const sanitizedDescription = computed(() => sanitizeHtml(manga.value?.description || ''))

    const fetchMangas = async () => {
      loading.value = true
      error.value = null

      try {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const apiUrl = `${apiBase}/chapters`
        const response = await fetch(apiUrl)
        const chapters = (await response.json()) || []

        const mangaList: Manga[] = chapters.map((chapter: any) => ({
          id: chapter.chapterId || chapter.id,
          title: chapter.title || chapter.name,
          author: chapter.author,
          artist: chapter.artist,
          theme: chapter.theme,
          status: chapter.status,
          description: chapter.description,
          coverPath: chapter.coverPath,
          coverUrl: chapter.coverUrl,
          lastChapter: chapter.lastChapter || chapter.chapter,
          lastEpisode: (chapter.lastEpisode !== undefined) ? chapter.lastEpisode : chapter.lastChapter,
          chapterUrl: chapter.chapterUrl || chapter.url,
          mangaUrl: chapter.mangaUrl,
          site: chapter.site,
        }))

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
          error.value = 'Anime non trouvé.'
        }
      } catch (err) {
        console.error('❌ Erreur lors de la récupération des animes :', err)
        error.value = 'Erreur de connexion au serveur.'
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchMangas)

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

    const openChapter = () => {
      if (manga.value.chapterUrl) {
        window.open(manga.value.chapterUrl, '_blank')
      }
    }

    const goEditLibrary = () => {
      if (!manga.value?.id) return
      router.push({ path: '/list', query: { editId: String(manga.value.id) } })
    }

    const editDialog = ref(false)
    const openEdit = async () => {
      if (isLoggedIn.value && manga.value?.title) {
        await checkLibraryStatus()
      }
      editDialog.value = true
    }

    const onUpdated = (payload: any) => {
      if (payload?.lastChapter !== undefined) {
        manga.value.lastChapter = payload.lastChapter
        ;(manga.value as any).userLastChapter = payload.lastChapter
      }
      if (payload?.readingStatus !== undefined) {
        ;(manga.value as any).readingStatus = payload.readingStatus
      }
    }

    const checkLibraryStatus = async () => {
      if (!authStore.user?.accessToken || !manga.value?.title) return
      try {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const apiUrl = `${apiBase}/library/user`
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${authStore.user.accessToken}` }
        })

        if (!response.ok) return
        const rows = await response.json()
        const found = (rows || []).find((r: any) => {
          if (!r || !r.title) return false
          const sameTitle = r.title === manga.value.title
          const sameSite = !manga.value.site || !r.site ? true : r.site === manga.value.site
          return sameTitle && sameSite
        })

        isInLibrary.value = Boolean(found)
        if (isInLibrary.value && found) {
          addSuccess.value = false
          addError.value = null
          ;(manga.value as any).userLastChapter = found.userLastChapter ?? found.lastChapter ?? manga.value.lastChapter
          ;(manga.value as any).readingStatus = found.readingStatus ?? (manga.value as any).readingStatus
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
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const apiUrl = `${apiBase}/library`
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
            lastChapter: (manga.value as any).lastEpisode || manga.value.lastChapter,
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
          throw new Error(data.message || 'Impossible d\'ajouter cet anime.')
        }

        addSuccess.value = true
        isInLibrary.value = true
      } catch (err: any) {
        addError.value = err?.message || 'Impossible d\'ajouter cet anime.'
      } finally {
        adding.value = false
      }
    }

    return { 
      manga,
      loading,
      error,
      openChapter,
      coverSrc,
      sanitizedDescription,
      isLoggedIn,
      addToLibrary,
      adding,
      addError,
      addSuccess,
      isInLibrary,
      goEditLibrary,
      // edit dialog bindings
      editDialog,
      openEdit,
      onUpdated
    }
  }
})
