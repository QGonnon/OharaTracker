import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Menu from '../../../Shared/Menu/Menu.vue'
import { useAuthStore } from '../../../../store/auth.module'
import { useMangaStore } from '../../../../store/manga.module'
import WatchlistService, { type Watchlist } from '../../../../services/watchlist.service'
import { usePageSeo } from '../../../../seo/usePageSeo'
import { localePath, localeMedia } from '../../../../seo/localePath'
import { slugify } from '../../../../utils'

export default defineComponent({
  name: 'Watchlists',
  components: { Menu },

  setup() {
    usePageSeo('watchlists', { noindex: true })
    const router = useRouter()
    const authStore = useAuthStore()
    const mangaStore = useMangaStore()

    const owned = ref<Watchlist[]>([])
    const followed = ref<Watchlist[]>([])
    const quotas = ref<{ owned: number | null; followed: number | null }>({ owned: null, followed: null })
    const loading = ref(true)
    const error = ref('')
    const newTitle = ref('')
    const newDescription = ref('')
    const creating = ref(false)
    const copiedId = ref<number | null>(null)

    const token = () => authStore.user?.accessToken

    const load = async () => {
      const accessToken = token()
      if (!accessToken) {
        router.push(localePath('login'))
        return
      }

      loading.value = true
      error.value = ''
      try {
        const data = await WatchlistService.list(accessToken)
        owned.value = data.owned
        followed.value = data.followed
        quotas.value = data.quotas
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur'
      } finally {
        loading.value = false
      }
    }

    // Quota nul = la création de listes n'est pas incluse dans l'offre, ce qui n'est
    // pas la même chose qu'un quota atteint : le message affiché diffère.
    const quotaReached = computed(() =>
      quotas.value.owned !== null && owned.value.length >= quotas.value.owned
    )

    const create = async () => {
      const accessToken = token()
      if (!accessToken || !newTitle.value.trim()) return

      creating.value = true
      error.value = ''
      try {
        owned.value = [await WatchlistService.create(accessToken, newTitle.value.trim(), newDescription.value.trim()), ...owned.value]
        newTitle.value = ''
        newDescription.value = ''
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur'
      } finally {
        creating.value = false
      }
    }

    const remove = async (list: Watchlist) => {
      const accessToken = token()
      if (!accessToken || !confirm(`Supprimer la liste « ${list.title} » ?`)) return

      await WatchlistService.remove(accessToken, list.id)
      owned.value = owned.value.filter(item => item.id !== list.id)
    }

    const toggleSharing = async (list: Watchlist) => {
      const accessToken = token()
      if (!accessToken) return

      try {
        const result = await WatchlistService.setSharing(accessToken, list.id, !list.isPublic)
        list.isPublic = result.isPublic
        list.shareToken = result.shareToken
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur'
      }
    }

    const shareUrl = (list: Watchlist) =>
      list.shareToken ? `${window.location.origin}${localePath('watchlists')}/${list.shareToken}` : ''

    const copyShareUrl = async (list: Watchlist) => {
      const url = shareUrl(list)
      if (!url) return

      try {
        await navigator.clipboard.writeText(url)
        copiedId.value = list.id
        setTimeout(() => { copiedId.value = null }, 2000)
      } catch {
        // Presse-papiers refusé (contexte non sécurisé) : le lien reste lisible à l'écran.
      }
    }

    const removeWork = async (list: Watchlist, idLibrary: number) => {
      const accessToken = token()
      if (!accessToken) return

      await WatchlistService.removeWork(accessToken, list.id, idLibrary)
      list.works = list.works.filter(work => work.idLibrary !== idLibrary)
    }

    const unfollow = async (list: Watchlist) => {
      const accessToken = token()
      if (!accessToken) return

      await WatchlistService.unfollow(accessToken, list.id)
      followed.value = followed.value.filter(item => item.id !== list.id)
    }

    const workLink = (work: { title: string; type: string | null }) =>
      localeMedia(mangaStore.resolveMediaKind(null, work.type ?? undefined), slugify(work.title))

    const coverUrl = (work: { coverPath: string | null; coverUrl: string | null }) =>
      mangaStore.getCoverUrl(work as any)

    onMounted(load)

    return {
      owned, followed, quotas, loading, error,
      newTitle, newDescription, creating, quotaReached, copiedId,
      create, remove, toggleSharing, shareUrl, copyShareUrl, removeWork, unfollow,
      workLink, coverUrl,
      libraryLink: computed(() => localePath('library')),
      pricingLink: computed(() => localePath('pricing')),
    }
  },
})
