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
import EditAnimeDialog from '../../../Shared/EditAnimeDialog/EditAnimeDialog.vue'
import type { Manga } from '../../../../types/index'
import { useMangaStore } from '../../../../store/manga.module'
import { useLibraryStore } from '../../../../store/library.module'

const parseTags = (theme: string | undefined): string[] => {
  if (!theme) return []
  return theme.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
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
    const mangaStore = useMangaStore()
    const libraryStore = useLibraryStore()
    const manga = ref<Manga>({} as Manga)
    const allMangas = ref<Manga[]>([])
    const loading = ref<boolean>(true)
    const error = ref<string | null>(null)
    const adding = ref<boolean>(false)
    const addError = ref<string | null>(null)
    const addSuccess = ref<boolean>(false)
    const isInLibrary = ref<boolean>(false)
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const isAnime = computed(() => mangaStore.isAnimeType(manga.value))
    const userScore = computed(() => manga.value.userScore ?? null)

    // Totaux épisodes/saisons : valeur BDD si dispo, sinon déduits des chapitres connus
    const seasonEpisodeStats = computed(() => mangaStore.getSeasonEpisodeStats(manga.value))
    const totalEpisodes = computed(() => manga.value.totalEpisodes ?? seasonEpisodeStats.value.totalEpisodes)
    const totalSeasons = computed(() => manga.value.totalSeasons ?? seasonEpisodeStats.value.totalSeasons)

    // Source de vérité unique pour le type de média
    const mediaKind = computed(() =>
      mangaStore.resolveMediaKind(route.name, manga.value.type)
    )

    // Aliases lisibles dans le template
    const isLecture = computed(() => mediaKind.value === 'lecture')
    const isSerie = computed(() => mediaKind.value === 'serie')
    const isFilm = computed(() => mediaKind.value === 'film')

    const getItemCover = (item: Manga): string => mangaStore.getCoverUrl(item)

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

    const coverSrc = computed(() => mangaStore.getCoverUrl(manga.value))

    // Génère le path de navigation vers une oeuvre similaire selon son type
    const similarWorkPath = (item: Manga): string => {
      const kind = mangaStore.resolveMediaKind(null, item.type)
      return `/${kind}/${slugify(item.title)}`
    }

    const fetchMangas = async () => {
      loading.value = true
      error.value = null
      try {
        const entries = await mangaStore.fetchAll()
        allMangas.value = entries

        const found = mangaStore.findBySlug(entries, route.params.name)

        if (found) {
          manga.value = found
          if (isLoggedIn.value) {
            await checkLibraryStatus()
          }
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

    const siteKeys = computed(() => manga.value.sites ? Object.keys(manga.value.sites) : [])

    const lastChapter = computed((): string => mangaStore.getLastChapterInfo(manga.value).chapter ?? '')

    const chapterUrl = computed((): string => mangaStore.getLastChapterInfo(manga.value).chapterUrl ?? '')

    const openChapter = () => {
      if (chapterUrl.value) window.open(chapterUrl.value, '_blank')
    }

    // 📖 Ouvrir la page du manga sur la source avec le plus de chapitres
    const openSource = () => {
      const bestKey = mangaStore.getBestSiteKey(manga.value)
      const mangaUrl = bestKey ? manga.value.sites[bestKey]?.mangaUrl : undefined
      if (mangaUrl) window.open(mangaUrl, '_blank')
    }

    const editDialog = ref(false)
    const openEdit = async () => {
      if (isLoggedIn.value && manga.value?.title) await checkLibraryStatus()
      editDialog.value = true
    }

    const onUpdated = (payload: any) => {
      if (payload?.lastChapter !== undefined) manga.value.userLastChapter = payload.lastChapter
      if (payload?.readingStatus !== undefined) manga.value.readingStatus = payload.readingStatus
      if (payload?.score !== undefined) manga.value.score = payload.score ?? null
      if (payload?.note !== undefined) manga.value.note = payload.note ?? null
    }

    const onDeleted = () => {
      isInLibrary.value = false
      addSuccess.value = false
      addError.value = null
      manga.value.userLastChapter = undefined
      manga.value.readingStatus = undefined
      manga.value.score = null
      manga.value.note = null
    }

    const checkLibraryStatus = async () => {
      if (!authStore.user?.accessToken || !manga.value?.id) return
      try {
        const client = await libraryStore.fetchClientInfo()

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
      if (!manga.value.title || !manga.value.id || !authStore.user?.accessToken) return
      addError.value = null
      addSuccess.value = false
      adding.value = true
      try {
        const bestKey = mangaStore.getBestSiteKey(manga.value)
        const bestSite = bestKey ? manga.value.sites[bestKey] : null
        const { chapter, chapterUrl: bestChapterUrl } = mangaStore.getLastChapterInfo(manga.value)
        const { ok, status, data } = await libraryStore.addToLibrary(manga.value.id, {
          title: manga.value.title,
          type: mediaKind.value, // envoie le nouveau type normalisé
          author: manga.value.author,
          theme: manga.value.theme,
          status: manga.value.status,
          description: manga.value.description,
          coverPath: manga.value.coverPath,
          coverUrl: manga.value.coverUrl,
          lastChapter: chapter,
          chapterUrl: bestChapterUrl ?? bestSite?.chapterUrl,
          mangaUrl: bestSite?.mangaUrl,
          site: bestKey || 'Unknown'
        })
        if (!ok) {
          if (status === 409) {
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
      openSource,
      coverSrc,
      isLoggedIn,
      isAnime,
      userScore,
      totalEpisodes,
      totalSeasons,
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
      onDeleted,
      siteKeys,
      lastChapter,
      chapterUrl,
      openChapter
    }
  }
})