<template>
  <Menu />

  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-4xl font-bold text-slate-900 dark:text-white mb-2">{{ $t('notifications.title') }}</h1>
          <p class="text-slate-600 dark:text-slate-400">{{ $t('notifications.unread_count', { n: unreadCount }) }}</p>
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="pushSupported && !pushEnabled"
            :label="$t('notifications.enable_push')"
            icon="pi pi-bell"
            outlined
            @click="enablePush"
          />
          <Button
            v-if="unreadCount > 0"
            :label="$t('notifications.mark_all_read')"
            icon="pi pi-check"
            @click="markAllAsRead"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" role="status" aria-live="polite" class="flex flex-col items-center justify-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-indigo-600 mb-4" aria-hidden="true"></i>
        <p class="text-lg text-slate-600 dark:text-slate-400">{{ $t('library.loading') }}</p>
      </div>

      <!-- Error State -->
      <Message v-else-if="error" severity="error" :closable="true" class="mb-6">
        <template #container="{ closeCallback }">
          <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            <span>{{ error }}</span>
            <Button icon="pi pi-times" :aria-label="$t('common.close')" @click="closeCallback()" text rounded/>
          </div>
        </template>
      </Message>

      <!-- Empty State -->
      <Card v-else-if="notifications.length === 0">
        <template #content>
          <div class="text-center py-12">
            <i class="pi pi-bell-slash text-4xl text-slate-300 dark:text-slate-600 mb-3" aria-hidden="true"></i>
            <p class="text-sm text-slate-600 dark:text-slate-400">{{ $t('notifications.empty') }}</p>
          </div>
        </template>
      </Card>

      <!-- List -->
      <div v-else class="flex flex-col gap-3">
        <Card
          v-for="n in notifications"
          :key="n.id"
          class="cursor-pointer hover:shadow-md transition-shadow"
          :class="{ 'border-l-4 border-indigo-500': !n.isRead }"
          @click="openNotification(n)"
        >
          <template #content>
            <div class="flex items-center gap-4">
              <img
                :src="getCoverUrl(n)"
                alt=""
                class="w-12 h-16 object-cover rounded-md flex-shrink-0" width="48" height="64" loading="lazy" decoding="async" />
              <div class="flex-1 min-w-0">
                <p class="text-sm text-slate-800 dark:text-zinc-200" :class="{ 'font-semibold': !n.isRead }">
                  {{ messageFor(n) }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <Tag v-if="!n.isRead" value="•" severity="info" class="!px-1.5 !py-0" />
                  <span class="text-xs text-slate-400 dark:text-slate-500">{{ new Date(n.createdAt).toLocaleString() }}</span>
                </div>
              </div>
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="secondary"
                @click="remove(n, $event)"
                v-tooltip="$t('notifications.delete')"
                :aria-label="$t('notifications.delete')"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script src="./NotificationsView.ts"></script>
