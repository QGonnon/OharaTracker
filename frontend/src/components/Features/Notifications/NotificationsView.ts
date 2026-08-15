import { defineComponent, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Menu from '../../Shared/Menu/Menu.vue'
import { useNotificationStore } from '../../../store/notification.module'
import { useMangaStore } from '../../../store/manga.module'
import { slugify } from '../../../utils'
import type { AppNotification } from '../../../types/index'

export default defineComponent({
  name: 'NotificationsView',
  components: { Menu, Card, Button, Message, Tag },
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const notificationStore = useNotificationStore()
    const mangaStore = useMangaStore()

    const loading = computed(() => notificationStore.loading)
    const error = computed(() => notificationStore.error)
    const notifications = computed(() => notificationStore.items)
    const unreadCount = computed(() => notificationStore.unreadCount)
    const pushSupported = computed(() => notificationStore.pushSupported)
    const pushEnabled = computed(() => notificationStore.pushEnabled)

    const isAnime = (n: AppNotification) => mangaStore.isAnimeType({
      type: n.mediaType ?? '',
      sites: n.site ? { [n.site]: { site: n.site, mangaUrl: '', chapterUrl: '', chapters: [] } } : {}
    })

    const messageFor = (n: AppNotification) => t(
      isAnime(n) ? 'notifications.new_episode' : 'notifications.new_chapter',
      { chapter: n.chapter, title: n.title }
    )

    const getCoverUrl = (n: AppNotification) => mangaStore.getCoverUrl({
      coverPath: n.coverPath ?? '',
      coverUrl: n.coverUrl ?? '',
      title: n.title
    })

    const openNotification = (n: AppNotification) => {
      notificationStore.markAsRead(n.id)
      if (n.chapterUrl) {
        window.open(n.chapterUrl, '_blank')
      } else {
        router.push(`/manga/${slugify(n.title)}`)
      }
    }

    const remove = (n: AppNotification, event: Event) => {
      event.stopPropagation()
      notificationStore.remove(n.id)
    }

    const enablePush = async () => {
      const result = await notificationStore.initPush()
      if (result === 'permission-denied') {
        alert(t('notifications.push_denied'))
      } else if (result === 'subscribe-failed') {
        alert(t('notifications.push_subscribe_failed', { error: notificationStore.pushError }))
      }
    }

    onMounted(() => {
      notificationStore.fetchNotifications()
      notificationStore.checkPushSubscription()
    })

    return {
      loading,
      error,
      notifications,
      unreadCount,
      pushSupported,
      pushEnabled,
      messageFor,
      getCoverUrl,
      openNotification,
      remove,
      enablePush,
      markAllAsRead: () => notificationStore.markAllAsRead(),
    }
  },
})
