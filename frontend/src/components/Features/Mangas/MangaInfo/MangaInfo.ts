import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Menu from '../../../Shared/Menu/Menu.vue'
import { slugify } from '../../../../utils'
import { useSeo } from '../../../../seo/useSeo'
import { breadcrumbJsonLd, mediaJsonLd } from '../../../../seo/jsonld'
import { DEFAULT_LOCALE, isLocale, homePath, pagePath, type Locale } from '../../../../seo/config'
import { localeMedia } from '../../../../seo/localePath'
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
    const router = useRouter()
    const { t, locale } = useI18n()
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

    const seasonEpisodeStats = computed(() => mangaStore.getSeasonEpisodeStats(manga.value))
    const totalEpisodes = computed(() => manga.value.totalEpisodes ?? seasonEpisodeStats.value.totalEpisodes)
    const totalSeasons = computed(() => manga.value.totalSeasons ?? seasonEpisodeStats.value.totalSeasons)

    const mediaKind = computed(() =>
      mangaStore.resolveMediaKind(route.name, manga.value.type)
    )

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

    const similarWorkPath = (item: Manga): string => {
      const kind = mangaStore.resolveMediaKind(null, item.type)
      return localeMedia(kind, slugify(item.title))
    }

    const notFound = ref(false) // true si le slug demandé ne correspond à aucune œuvre (404)

    const fetchMangas = async () => {
      loading.value = true
      error.value = null
      notFound.value = false
      try {
        const slug = String(route.params.name ?? '')
        const found = await mangaStore.fetchBySlug(slug)

        if (found) {
          manga.value = found

          // Le slug canonique peut différer de celui de l'URL (ancienne forme, sans accents).
          const canonicalSlug = slugify(found.title)
          if (canonicalSlug && canonicalSlug !== slug) {
            router.replace(localeMedia(mediaKind.value, canonicalSlug))
          }

          if (isLoggedIn.value) {
            await checkLibraryStatus()
          }
        } else {
          manga.value = {} as Manga
          notFound.value = true
          error.value = t('errors.not_found.title')
        }
      } catch (err) {
        console.error('Erreur lors de la récupération :', err)
        error.value = 'Erreur de connexion au serveur.'
      } finally {
        loading.value = false
      }
    }

    // Chargées après la fiche pour ne pas retarder le contenu principal (LCP).
    const fetchSimilar = async () => {
      try {
        allMangas.value = await mangaStore.fetchLight()
      } catch (err) {
        console.error('Erreur chargement des oeuvres similaires', err)
      }
    }

    onMounted(async () => {
      await fetchMangas()
      if (!notFound.value) fetchSimilar()
    })

    const currentLocale = computed<Locale>(() =>
      isLocale(locale.value) ? locale.value : DEFAULT_LOCALE
    )

    const canonicalSlug = computed(() =>
      manga.value.title ? slugify(manga.value.title) : String(route.params.name ?? '')
    )

    const seoDescription = computed(() => {
      if (notFound.value) return t('errors.not_found.description')
      const synopsis = manga.value.description?.replace(/\s+/g, ' ').trim()
      if (synopsis) {
        // Google tronque autour de 160 caractères : on coupe au mot entier.
        if (synopsis.length <= 155) return synopsis
        const cut = synopsis.slice(0, 155)
        return cut.slice(0, cut.lastIndexOf(' ')).trimEnd() + '…'
      }
      return t(`seo.media.${mediaKind.value}.description`, { title: manga.value.title ?? '' })
    })

    useSeo({
      target: computed(() => ({
        type: 'media' as const,
        kind: mediaKind.value,
        slug: canonicalSlug.value,
      })),
      title: computed(() =>
        notFound.value || !manga.value.title
          ? t('errors.not_found.title')
          : t(`seo.media.${mediaKind.value}.title`, { title: manga.value.title })
      ),
      description: seoDescription,
      image: computed(() => (manga.value.title ? coverSrc.value : undefined)),
      noindex: computed(() => notFound.value || !manga.value.title),
      ogType: 'article',
      jsonLd: computed(() => {
        if (notFound.value || !manga.value.title) return []
        return [
          mediaJsonLd({
            title: manga.value.title,
            kind: mediaKind.value,
            description: manga.value.description,
            author: manga.value.author,
            artist: manga.value.artist,
            theme: manga.value.theme,
            image: coverSrc.value,
            url: `${window.location.origin}${localeMedia(mediaKind.value, canonicalSlug.value, currentLocale.value)}`,
            locale: currentLocale.value,
            status: manga.value.status,
            // schema.org attend un nombre ; la base renvoie parfois ces totaux en chaîne.
            totalEpisodes: Number(totalEpisodes.value) || undefined,
            totalSeasons: Number(totalSeasons.value) || undefined,
            // Pas de note agrégée exposée : un aggregateRating vide serait un rich result trompeur.
            ratingValue: null,
            ratingCount: null,
          }),
          breadcrumbJsonLd([
            { name: t('seo.breadcrumb.home'), path: homePath(currentLocale.value) },
            { name: t('seo.discovery.title'), path: pagePath('discovery', currentLocale.value) },
            {
              name: manga.value.title,
              path: localeMedia(mediaKind.value, canonicalSlug.value, currentLocale.value),
            },
          ]),
        ]
      }),
    })

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
          type: mediaKind.value,
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
      notFound,
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