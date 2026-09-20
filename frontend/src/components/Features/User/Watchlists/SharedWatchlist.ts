import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Menu from '../../../Shared/Menu/Menu.vue'
import { useAuthStore } from '../../../../store/auth.module'
import { useMangaStore } from '../../../../store/manga.module'
import WatchlistService, { type Watchlist } from '../../../../services/watchlist.service'
import { usePageSeo } from '../../../../seo/usePageSeo'
import { localePath, localeMedia } from '../../../../seo/localePath'
import { slugify } from '../../../../utils'

export default defineComponent({
  name: 'SharedWatchlist',
  components: { Menu },

  setup() {
    // Un lien de partage ne doit pas finir dans l'index : il circule de la main à la main.
    usePageSeo('watchlists', { noindex: true })
    const route = useRoute()
    const authStore = useAuthStore()
    const mangaStore = useMangaStore()

    const list = ref<Watchlist | null>(null)
    const loading = ref(true)
    const error = ref('')
    const following = ref(false)
    const followed = ref(false)

    const shareToken = computed(() => String(route.params.token ?? ''))

    const load = async () => {
      loading.value = true
      error.value = ''
      try {
        list.value = await WatchlistService.getShared(shareToken.value)
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur'
      } finally {
        loading.value = false
      }
    }

    const follow = async () => {
      const token = authStore.user?.accessToken
      if (!token) return

      following.value = true
      error.value = ''
      try {
        await WatchlistService.follow(token, shareToken.value)
        followed.value = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur'
      } finally {
        following.value = false
      }
    }

    const workLink = (work: { title: string; type: string | null }) =>
      localeMedia(mangaStore.resolveMediaKind(null, work.type ?? undefined), slugify(work.title))

    const coverUrl = (work: { coverPath: string | null; coverUrl: string | null }) =>
      mangaStore.getCoverUrl(work as any)

    onMounted(load)

    return {
      list, loading, error, following, followed, follow, workLink, coverUrl,
      isLoggedIn: computed(() => authStore.isLoggedIn),
      loginLink: computed(() => localePath('login')),
      watchlistsLink: computed(() => localePath('watchlists')),
    }
  },
})
