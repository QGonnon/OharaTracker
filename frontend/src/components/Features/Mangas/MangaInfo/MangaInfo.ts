import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import Menu from '../../../Shared/Menu/Menu.vue'
import { slugify } from '../../../../utils'
import { useAuthStore } from '../../../../store/auth.module'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Chip from 'primevue/chip'
import Divider from 'primevue/divider'
import EditLibraryDialog from '../../../Shared/EditLibraryDialog/EditLibraryDialog.vue'
import EditAnimeDialog from '../../../Shared/EditLibraryDialog/EditAnimeDialog.vue'
import type { Manga } from '../../../../types/index'

const parseTags = (theme: string | undefined): string[] => {
  if (!theme) return []
  return theme.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
}

export default defineComponent({
  name: 'MangaInfo',
  components: {
    Menu,
    Card,
    Button,
    Message,
    Tag,
    Chip,
    Divider,
    EditLibraryDialog,
    EditAnimeDialog
  },

  setup() {
    const route = useRoute()
    const authStore = useAuthStore()
    const manga = ref<Manga>({} as Manga)
    const allMangas = ref<Manga[]>([])
    const loading = ref<boolean>(true)
    const error = ref<string | null>(null)
    const adding = ref<boolean>(false)
    const addError = ref<string | null>(null)
    const addSuccess = ref<boolean>(false)
    const isInLibrary = ref<boolean>(false)
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const animeSources = ['moviedb', 'anime-sama']
    const isAnime = computed(() => !!manga.value.sites && animeSources.some(source => manga.value.sites[source]))

    const getBestSiteKey = (m: Manga): string => {
      let bestKey = ''
      let maxChapters = 0
      for (const key in m.sites) {
        if (m.sites[key].chapters.length > maxChapters) {
          maxChapters = m.sites[key].chapters.length
          bestKey = key
        }
      }
      return bestKey
    }

    const getItemCover = (item: Manga): string => {
      const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
      if (item.coverPath) return `${apiBase}/cdn/${item.coverPath}`
      if (item.coverUrl) return item.coverUrl
      return `https://picsum.photos/seed/${item.title}/200/300`
    }

    const similarWorks = computed(() => {
      const currentTags = parseTags(manga.value.theme)
      if (currentTags.length === 0) return []
      return allMangas.value
        .filter(m => m.title !== manga.value.title)
        .map(m => ({
          ...m,
          commonTagCount: parseTags(m.theme).filter(t => currentTags.includes(t)).length
        }))
        .filter(m => m.commonTagCount >= 3)
        .sort((a, b) => b.commonTagCount - a.commonTagCount)
        .slice(0, 6)
    })

    const coverSrc = computed(() => {
      const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
      
      if (manga.value.coverPath) {
        return `${apiBase}/cdn/${manga.value.coverPath}`
      }
      if (manga.value.coverUrl) return manga.value.coverUrl
      return `https://picsum.photos/seed/${manga.value.title}/400/300`
    })

    const fetchMangas = async () => {
      loading.value = true
      error.value = null

      try {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const response = await fetch(`${apiBase}/chapters`)
        const chaptersMap: Record<string, any> = (await response.json()) || {}

        // Object.entries pour garder le libraryId (clé) et éviter les trous du tableau sparse
        const entries = Object.entries(chaptersMap).filter(([, m]) => m?.title)
        const foundEntry = entries.find(([, m]) => slugify(m.title) === route.params.name)

        allMangas.value = entries.map(([id, m]) => ({ ...m, id: Number(id) } as Manga))

        if (foundEntry) {
          const [id, data] = foundEntry
          manga.value = { ...data, id: Number(id) } as Manga
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

    const siteKeys = computed(() => manga.value.sites ? Object.keys(manga.value.sites) : [])

    const lastChapter = computed((): string => {
      if (!manga.value.sites) return ''
      const bestKey = getBestSiteKey(manga.value)
      return bestKey ? manga.value.sites[bestKey].chapters?.[0]?.chapter ?? '' : ''
    })

    const chapterUrl = computed((): string => {
      if (!manga.value.sites) return ''
      const bestKey = getBestSiteKey(manga.value)
      const site = bestKey ? manga.value.sites[bestKey] : null
      return site?.chapters?.[0]?.chapterUrl ?? site?.chapterUrl ?? ''
    })

    const openChapter = () => {
      if (chapterUrl.value) window.open(chapterUrl.value, '_blank')
    }

    // 📖 Ouvrir la page du manga sur la source avec le plus de chapitres
    const openSource = () => {
      let bestSource = ''
      let maxChapters = 0
      for (const site in manga.value.sites) {
        const chapters = manga.value.sites[site].chapters.length
        if (chapters > maxChapters) {
          maxChapters = chapters
          bestSource = site
        }
      }
      if (manga.value.sites[bestSource]?.mangaUrl) {
        window.open(manga.value.sites[bestSource].mangaUrl, '_blank')
      }
    }

    const editDialog = ref(false)
    const openEdit = async () => {
      // Ensure library status is loaded before opening edit dialog
      if (isLoggedIn.value && manga.value?.title) {
        await checkLibraryStatus()
      }
      editDialog.value = true
    }

    const onUpdated = (payload: any) => {
      if (payload?.lastChapter !== undefined) manga.value.userLastChapter = payload.lastChapter
      if (payload?.readingStatus !== undefined) manga.value.readingStatus = payload.readingStatus
      if (payload?.score !== undefined) manga.value.score = payload.score ?? null
      if (payload?.note !== undefined) manga.value.note = payload.note ?? null
    }

    const checkLibraryStatus = async () => {
      if (!authStore.user?.accessToken || !manga.value?.id) return
      try {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const response = await fetch(`${apiBase}/client`, {
          headers: { Authorization: `Bearer ${authStore.user.accessToken}` }
        })

        if (!response.ok) return
        const client = await response.json()

        const found = (client.libraryUsage ?? []).find((u: any) => u.libraryId === manga.value.id)

        isInLibrary.value = Boolean(found)
        if (found) {
          addSuccess.value = false
          addError.value = null
          manga.value.userLastChapter = found.lastReadChapter ?? undefined
          manga.value.readingStatus = found.readingStatus ?? undefined
          manga.value.score = found.clientScore ?? null
          manga.value.note = found.clientNote ?? null
        }
      } catch (err) {
        console.error('Erreur vérification bibliothèque', err)
      }
    }

    const addToLibrary = async () => {
      if (!manga.value.title || !authStore.user?.accessToken) return
      addError.value = null
      addSuccess.value = false
      adding.value = true

      try {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const apiUrl = `${apiBase}/library`
        const bestKey = getBestSiteKey(manga.value)
        const bestSite = bestKey ? manga.value.sites[bestKey] : null
        const lastChapterEntry = bestSite?.chapters?.[0]
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
            lastChapter: lastChapterEntry?.chapter,
            chapterUrl: lastChapterEntry?.chapterUrl ?? bestSite?.chapterUrl,
            mangaUrl: bestSite?.mangaUrl,
            site: bestKey || 'Unknown'
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
        await checkLibraryStatus()
        editDialog.value = true
      } catch (err: any) {
        addError.value = err?.message || 'Impossible d\'ajouter ce manga.'
      } finally {
        adding.value = false
      }
    }

    const formatAnimeNumber = (num: string): string => {
      //{{ isAnime ? $t('manga.season') + " " + manga.lastChapter.split('.')[0]:"" }} {{ $t('manga.episode') + " " + manga.lastChapter.split('.')[1] || $t('manga.unknown') }}
      const numArray = num.split('.') || []
      const season = numArray[0] ? `manga.season${numArray[0]}` : ''
      const episode = numArray[1] ? `manga.episode${numArray[1]}` : ''
      return `${season}${season && episode ? ' ' : ''}${episode}`
      
    }

    return {
      manga,
      loading,
      error,
      openSource,
      coverSrc,
      isLoggedIn,
      isAnime,
      addToLibrary,
      adding,
      addError,
      addSuccess,
      isInLibrary,
      similarWorks,
      parseTags,
      slugify,
      getItemCover,
      // edit dialog bindings
      editDialog,
      openEdit,
      onUpdated,
      formatAnimeNumber,
      siteKeys,
      lastChapter,
      chapterUrl,
      openChapter
    }
  }
})
