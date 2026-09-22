import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import Popover from 'primevue/popover'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../store/auth.module'
import { useNotificationStore } from '../../../store/notification.module'
import { useMangaStore } from '../../../store/manga.module'
import type { AppNotification } from '../../../types/index'
import { notificationMessage, openNotificationTarget } from './notificationDisplay'

export default defineComponent({
  name: 'NotificationBell',
  components: { Popover, Badge, Button },
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const authStore = useAuthStore()
    const notificationStore = useNotificationStore()
    const mangaStore = useMangaStore()
    const panelRef = ref()

    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const unreadCount = computed(() => notificationStore.unreadCount)
    const badgeValue = computed(() => (unreadCount.value > 9 ? '9+' : String(unreadCount.value)))
    const recentNotifications = computed(() => notificationStore.items.slice(0, 6))

    const messageFor = (n: AppNotification) => notificationMessage(n, t, mangaStore)

    const toggle = (event: Event) => {
      panelRef.value?.toggle(event)
      if (notificationStore.items.length === 0) {
        notificationStore.fetchNotifications({ limit: 6 })
      }
    }

    const openNotification = (n: AppNotification) => {
      notificationStore.markAsRead(n.id)
      panelRef.value?.hide()
      openNotificationTarget(n, router, mangaStore)
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
