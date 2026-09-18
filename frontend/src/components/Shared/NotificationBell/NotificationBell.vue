<template>
  <div v-if="isLoggedIn" class="relative">
    <button
      type="button"
      class="nav-theme-toggle relative"
      :aria-label="unreadCount > 0
        ? $t('notifications.title_with_count', { n: unreadCount })
        : $t('notifications.title')"
      aria-haspopup="dialog"
      @click="toggle"
    >
      <i class="pi pi-bell text-sm" aria-hidden="true" />
      <Badge
        v-if="unreadCount > 0"
        :value="badgeValue"
        severity="danger"
        aria-hidden="true"
        class="!absolute -top-1 -right-1 !text-[10px] !min-w-[1.1rem] !h-[1.1rem] !leading-[1.1rem]"
      />
    </button>

    <Popover ref="panelRef" class="notification-popover">
      <div class="w-80 max-w-[90vw]">
        <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-white/10">
          <span class="font-semibold text-sm text-gray-900 dark:text-white">{{ $t('notifications.title') }}</span>
          <Button
            v-if="unreadCount > 0"
            :label="$t('notifications.mark_all_read')"
            text
            size="small"
            class="!text-xs !p-0"
            @click="markAllAsRead"
          />
        </div>

        <div v-if="loading" class="flex items-center justify-center py-8">
          <i class="pi pi-spin pi-spinner text-xl text-indigo-500"  aria-hidden="true"/>
        </div>

        <div v-else-if="recentNotifications.length === 0" class="py-8 text-center text-sm text-gray-600 dark:text-zinc-400">
          <i class="pi pi-bell-slash text-2xl mb-2 block text-gray-300 dark:text-zinc-400"  aria-hidden="true"/>
          {{ $t('notifications.empty') }}
        </div>

        <ul v-else class="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
          <li
            v-for="n in recentNotifications"
            :key="n.id"
            :class="{ 'bg-indigo-50/60 dark:bg-indigo-500/5': !n.isRead }"
          >
          <button
            type="button"
            class="w-full text-left flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-600"
            @click="openNotification(n)"
          >
            <span
              aria-hidden="true"
              class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
              :class="n.isRead ? 'bg-transparent' : 'bg-indigo-500'"
            />
            <div class="min-w-0">
              <p class="text-sm text-gray-800 dark:text-zinc-200 line-clamp-2" :class="{ 'font-semibold': !n.isRead }">
                {{ messageFor(n) }}
              </p>
              <time :datetime="n.createdAt" class="text-xs text-gray-600 dark:text-zinc-400">
                {{ new Date(n.createdAt).toLocaleString($i18n.locale) }}
              </time>
            </div>
          </button>
          </li>
        </ul>

        <div class="px-3 py-2 border-t border-gray-100 dark:border-white/10 text-center">
          <Button :label="$t('notifications.see_all')" text size="small" class="!text-xs w-full" @click="goToAll" />
        </div>
      </div>
    </Popover>
  </div>
</template>

<script lang="ts">
import component from './NotificationBell.ts'
export default component
</script>
