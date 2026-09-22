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
import type { AppNotification } from '../../../types/index'
import { usePageSeo } from '../../../seo/usePageSeo';
import { notificationMessage, openNotificationTarget, isSocialNotification } from '../../Shared/NotificationBell/notificationDisplay'

export default defineComponent({
  name: 'NotificationsView',
  components: { Menu, Card, Button, Message, Tag },
  setup() {
    usePageSeo('notifications', { noindex: true });
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

    const messageFor = (n: AppNotification) => notificationMessage(n, t, mangaStore)

    // Un événement social n'a pas de couverture : on affiche une icône à la place.
    const getCoverUrl = (n: AppNotification) => isSocialNotification(n) ? '' : mangaStore.getCoverUrl({
      coverPath: n.coverPath ?? '',
      coverUrl: n.coverUrl ?? '',
      title: n.title ?? ''
    })

    const openNotification = (n: AppNotification) => {
      notificationStore.markAsRead(n.id)
      openNotificationTarget(n, router, mangaStore)
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
      } else if (result === 'unsupported') {
        alert(t('notifications.push_unsupported'))
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
      isSocialNotification,
      openNotification,
      remove,
      enablePush,
      markAllAsRead: () => notificationStore.markAllAsRead(),
    }
  },
})
