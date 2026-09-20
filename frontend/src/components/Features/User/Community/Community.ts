import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Menu from '../../../Shared/Menu/Menu.vue'
import { useAuthStore } from '../../../../store/auth.module'
import { useMangaStore } from '../../../../store/manga.module'
import CommunityService, { type CommunityProfile, type FeedEntry, type FriendLists } from '../../../../services/community.service'
import { usePageSeo } from '../../../../seo/usePageSeo'
import { localePath, localeMedia } from '../../../../seo/localePath'
import { slugify } from '../../../../utils'

export default defineComponent({
  name: 'Community',
  components: { Menu },

  setup() {
    usePageSeo('community', { noindex: true })
    const router = useRouter()
    const authStore = useAuthStore()
    const mangaStore = useMangaStore()

    const feed = ref<FeedEntry[]>([])
    const lists = ref<FriendLists>({ friends: [], sent: [], received: [] })
    const results = ref<CommunityProfile[]>([])
    const query = ref('')
    const searching = ref(false)
    const searched = ref(false)
    const isPublic = ref(false)
    const loading = ref(true)
    const error = ref('')

    const token = () => authStore.user?.accessToken

    const load = async () => {
      const accessToken = token()
      if (!accessToken) {
        router.push(localePath('login'))
        return
      }

      loading.value = true
      try {
        const me = authStore.currentUser?.username
        const [feedData, friendData, myProfile] = await Promise.all([
          CommunityService.feed(accessToken),
          CommunityService.friends(accessToken),
          me ? CommunityService.profile(accessToken, me) : Promise.resolve(null),
        ])
        feed.value = feedData
        lists.value = friendData
        isPublic.value = myProfile?.isPublic === true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur'
      } finally {
        loading.value = false
      }
    }

    const search = async () => {
      const accessToken = token()
      if (!accessToken || query.value.trim().length < 2) return

      searching.value = true
      error.value = ''
      try {
        results.value = await CommunityService.search(accessToken, query.value.trim())
        searched.value = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur'
      } finally {
        searching.value = false
      }
    }

    const addFriend = async (profile: CommunityProfile) => {
      const accessToken = token()
      if (!accessToken) return

      try {
        const { status } = await CommunityService.request(accessToken, profile.username)
        profile.friendStatus = status as CommunityProfile['friendStatus']
        await load()
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur'
      }
    }

    const acceptFriend = async (profile: CommunityProfile) => {
      const accessToken = token()
      if (!accessToken) return

      await CommunityService.accept(accessToken, profile.username)
      await load()
    }

    const removeFriend = async (profile: CommunityProfile) => {
      const accessToken = token()
      if (!accessToken) return

      await CommunityService.remove(accessToken, profile.username)
      await load()
    }

    const toggleVisibility = async () => {
      const accessToken = token()
      if (!accessToken) return

      const { isPublic: saved } = await CommunityService.setVisibility(accessToken, !isPublic.value)
      isPublic.value = saved
    }

    const workLink = (entry: FeedEntry) =>
      localeMedia(mangaStore.resolveMediaKind(null, entry.mediaType ?? undefined), slugify(entry.title))

    // Un fil daté à la seconde n'apporte rien : on raisonne en ordre de grandeur.
    const relativeTime = (iso: string): string => {
      const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
      if (minutes < 60) return `${Math.max(1, minutes)} min`
      const hours = Math.round(minutes / 60)
      if (hours < 24) return `${hours} h`
      return `${Math.round(hours / 24)} j`
    }

    onMounted(load)

    return {
      feed, lists, results, query, searching, searched, isPublic, loading, error,
      search, addFriend, acceptFriend, removeFriend, toggleVisibility, workLink, relativeTime,
      hasFriends: computed(() => lists.value.friends.length > 0),
      profileLink: computed(() => localePath('profile')),
    }
  },
})
