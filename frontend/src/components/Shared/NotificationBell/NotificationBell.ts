import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import Popover from 'primevue/popover'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../store/auth.module'
import { useNotificationStore } from '../../../store/notification.module'
import mangaService from '../../../services/manga.service'
import { slugify } from '../../../utils'
import type { AppNotification } from '../../../types/index'

export default defineComponent({
  name: 'NotificationBell',
  components: { Popover, Badge, Button },
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const authStore = useAuthStore()
    const notificationStore = useNotificationStore()
    const panelRef = ref()

    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const unreadCount = computed(() => notificationStore.unreadCount)
    const badgeValue = computed(() => (unreadCount.value > 9 ? '9+' : String(unreadCount.value)))
    const recentNotifications = computed(() => notificationStore.items.slice(0, 6))

    const isAnime = (n: AppNotification) => mangaService.isAnimeType({
      type: n.mediaType ?? '',
      sites: n.site ? { [n.site]: { site: n.site, mangaUrl: '', chapterUrl: '', chapters: [] } } : {}
    })

    const messageFor = (n: AppNotification) => t(
      isAnime(n) ? 'notifications.new_episode' : 'notifications.new_chapter',
      { chapter: n.chapter, title: n.title }
    )

    const toggle = (event: Event) => {
      panelRef.value?.toggle(event)
      if (notificationStore.items.length === 0) {
        notificationStore.fetchNotifications({ limit: 6 })
      }
    }

    const openNotification = (n: AppNotification) => {
      notificationStore.markAsRead(n.id)
      panelRef.value?.hide()
      if (n.chapterUrl) {
        window.open(n.chapterUrl, '_blank')
      } else {
        router.push(`/manga/${slugify(n.title)}`)
      }
    }

    const markAllAsRead = () => notificationStore.markAllAsRead()

    const goToAll = () => {
      panelRef.value?.hide()
      router.push({ name: 'Notifications' })
    }

    watch(isLoggedIn, (logged) => {
      if (logged) notificationStore.fetchUnreadCount()
    }, { immediate: true })

    onMounted(() => {
      if (isLoggedIn.value) notificationStore.fetchUnreadCount()
    })

    return {
      panelRef,
      isLoggedIn,
      unreadCount,
      badgeValue,
      recentNotifications,
      loading: computed(() => notificationStore.loading),
      messageFor,
      toggle,
      openNotification,
      markAllAsRead,
      goToAll,
    }
  },
})
