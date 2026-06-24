import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { /*useRouter,*/ useRoute } from 'vue-router'
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
import type { Manga, MediaKind } from '../../../../types/index'

const parseTags = (theme: string | undefined): string[] => {
  if (!theme) return []
  return theme.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
}

// Résout le MediaKind depuis le nom de route ou le champ type BDD
const resolveMediaKind = (routeName: string | symbol | null | undefined, dbType?: string): MediaKind => {
  const name = String(routeName || '').toLowerCase()

  // Priorité : nom de route explicite (nouvelles routes)
  if (name.includes('lecture')) return 'lecture'
  if (name.includes('serie')) return 'serie'
  if (name.includes('film')) return 'film'

  // Fallback : champ type BDD (migration en cours par le collègue)
  if (dbType) {
    const t = dbType.toLowerCase()
    if (t === 'lecture') return 'lecture'
    if (t === 'serie') return 'serie'
    if (t === 'film') return 'film'
    // Anciens types
    if (t === 'anime') return 'serie'
    if (t === 'manga') return 'lecture'
  }

  // Fallback : anciennes routes
  if (name.includes('anime')) return 'serie'
  return 'lecture' // défaut
}

export default defineComponent({
  name: 'MangaInfo',
  components: {
    Menu, Card, Button, Message, Tag, Chip, Divider,
    EditLibraryDialog, EditAnimeDialog
  },

  setup() {
    const route = useRoute()
    //const router = useRouter()
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
    const userScore = computed(() => (manga.value as any).userScore ?? null)

    // Source de vérité unique pour le type de média
    const mediaKind = computed<MediaKind>(() =>
      resolveMediaKind(route.name, manga.value.type)
    )

    // Aliases lisibles dans le template
    const isLecture = computed(() => mediaKind.value === 'lecture')
    const isSerie = computed(() => mediaKind.value === 'serie')
    const isFilm = computed(() => mediaKind.value === 'film')

    const getItemCover = (item: Manga): string => {
      const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
      if (item.coverPath) return `${apiBase}/cdn/${item.coverPath}`
      if (item.coverUrl) return item.coverUrl
      return `https://picsum.photos/seed/${item.id}/200/300`
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
      if (manga.value.coverPath) return `${apiBase}/cdn/${manga.value.coverPath}`
      if (manga.value.coverUrl) return manga.value.coverUrl
      return `https://picsum.photos/seed/${manga.value.id}/400/300`
    })

    // Génère le path de navigation vers une oeuvre similaire selon son type
    const similarWorkPath = (item: Manga): string => {
      const kind = resolveMediaKind(null, item.type)
      return `/${kind}/${slugify(item.title)}`
    }

    const fetchMangas = async () => {
      loading.value = true
      error.value = null
      try {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const response = await fetch(`${apiBase}/chapters`)
        const chapters = (await response.json()) || []

        const mangaList: Manga[] = chapters.map((chapter: any) => ({
          id: chapter.chapterId || chapter.id,
          title: chapter.title || chapter.name,
          type: chapter.type,
          author: chapter.author,
          artist: chapter.artist,
          studio: chapter.studio || chapter.artist,
          theme: chapter.theme,
          status: chapter.status,
          description: chapter.description,
          releaseDate: chapter.releaseDate || chapter.published,
          averageScore: chapter.averageScore ?? chapter.score,
          coverPath: chapter.coverPath,
          coverUrl: chapter.coverUrl,
          lastChapter: chapter.lastChapter || chapter.chapter,
          totalEpisodes: chapter.totalEpisodes,
          totalSeasons: chapter.totalSeasons,
          chapterUrl: chapter.chapterUrl || chapter.url,
          mangaUrl: chapter.mangaUrl,
          site: chapter.site,
        }))

        allMangas.value = mangaList
        const found = mangaList.find(m => slugify(m.title) === route.params.name)

        if (found) {
          manga.value = found
          if (isLoggedIn.value) await checkLibraryStatus()
        } else {
          manga.value = {} as Manga
          error.value = 'Oeuvre non trouvée.'
        }
      } catch (err) {
        console.error('Erreur lors de la récupération :', err)
        error.value = 'Erreur de connexion au serveur.'
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchMangas)

    watch(() => route.params.name, (newName, oldName) => {
      if (newName !== oldName) fetchMangas()
    })

    watch(() => isLoggedIn.value, (loggedIn) => {
      if (!loggedIn) {
        isInLibrary.value = false
        addSuccess.value = false
        addError.value = null
        return
      }
      if (manga.value?.title) checkLibraryStatus()
    })

    const openChapter = () => {
      if (manga.value.chapterUrl) window.open(manga.value.chapterUrl, '_blank')
    }

    const editDialog = ref(false)
    const openEdit = async () => {
      if (isLoggedIn.value && manga.value?.title) await checkLibraryStatus()
      editDialog.value = true
    }

    const onUpdated = (payload: any) => {
      if (payload?.lastChapter !== undefined) {
        manga.value.lastChapter = payload.lastChapter
        ;(manga.value as any).userLastChapter = payload.lastChapter
      }
      if (payload?.lastEpisode !== undefined) {
        ;(manga.value as any).userLastEpisode = payload.lastEpisode
      }
      if (payload?.readingStatus !== undefined) {
        ;(manga.value as any).readingStatus = payload.readingStatus
      }
    }

    const checkLibraryStatus = async () => {
      if (!authStore.user?.accessToken || !manga.value?.title) return
      try {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const response = await fetch(`${apiBase}/library/user`, {
          headers: { Authorization: `Bearer ${authStore.user.accessToken}` }
        })
        if (!response.ok) return
        const rows = await response.json()
        const found = (rows || []).find((r: any) => {
          if (!r?.title) return false
          const sameTitle = r.title === manga.value.title
          const sameSite = !manga.value.site || !r.site ? true : r.site === manga.value.site
          return sameTitle && sameSite
        })
        isInLibrary.value = Boolean(found)
        if (isInLibrary.value && found) {
          addSuccess.value = false
          addError.value = null
          manga.value.id = found.id
          ;(manga.value as any).userLastChapter = found.userLastChapter ?? found.lastChapter ?? manga.value.lastChapter
          ;(manga.value as any).userScore = found.userScore ?? (manga.value as any).userScore
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
        const response = await fetch(`${apiBase}/library`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.user.accessToken}`
          },
          body: JSON.stringify({
            title: manga.value.title,
            type: mediaKind.value, // envoie le nouveau type normalisé
            author: manga.value.author,
            studio: manga.value.studio,
            theme: manga.value.theme,
            status: manga.value.status,
            description: manga.value.description,
            releaseDate: manga.value.releaseDate,
            coverPath: manga.value.coverPath,
            coverUrl: manga.value.coverUrl,
            lastChapter: manga.value.lastChapter,
            chapterUrl: manga.value.chapterUrl,
            mangaUrl: manga.value.mangaUrl,
            site: manga.value.site || 'Unknown'
          })
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: "Erreur lors de l'ajout." }))
          if (response.status === 409) {
            isInLibrary.value = true
            addError.value = data.message || 'Déjà dans votre bibliothèque.'
            return
          }
          throw new Error(data.message || "Impossible d'ajouter cette oeuvre.")
        }
        addSuccess.value = true
        isInLibrary.value = true
        await checkLibraryStatus()
        editDialog.value = true
      } catch (err: any) {
        addError.value = err?.message || "Impossible d'ajouter cette oeuvre."
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
      isLoggedIn,
      mediaKind,
      isLecture,
      isSerie,
      isFilm,
      addToLibrary,
      adding,
      addError,
      addSuccess,
      isInLibrary,
      similarWorks,
      similarWorkPath,
      parseTags,
      slugify,
      getItemCover,
      editDialog,
      openEdit,
      onUpdated,
      userScore,
    }
  }
})