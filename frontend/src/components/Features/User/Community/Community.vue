<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
    <Menu />

    <div class="max-w-5xl mx-auto px-4 py-12">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ $t('community.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">{{ $t('community.subtitle') }}</p>
      </header>

      <div v-if="error" role="alert" class="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
        {{ error }}
      </div>

      <div class="grid lg:grid-cols-[1fr_320px] gap-6">
        <!-- Fil d'actualité -->
        <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <h2 class="text-lg font-bold mb-4">{{ $t('community.feed') }}</h2>
          <p v-if="loading" class="text-sm text-slate-500 dark:text-slate-400">{{ $t('community.loading') }}</p>
          <p v-else-if="!feed.length" class="text-sm text-slate-500 dark:text-slate-400">{{ $t('community.feed_empty') }}</p>

          <ul v-else class="space-y-4">
            <li v-for="entry in feed" :key="`${entry.username}-${entry.idLibrary}-${entry.createdAt}`" class="flex items-start gap-3">
              <img v-if="entry.avatarUrl" :src="entry.avatarUrl" alt="" class="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              <span v-else class="w-9 h-9 rounded-full bg-violet-500 text-white grid place-items-center text-sm font-bold flex-shrink-0">
                {{ entry.username?.charAt(0).toUpperCase() }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm text-slate-700 dark:text-slate-200">
                  <span class="font-semibold">{{ entry.username }}</span>
                  {{ $t(`community.action.${entry.type}`) }}
                  <RouterLink :to="workLink(entry)" class="font-semibold text-violet-600 dark:text-violet-400 hover:underline">{{ entry.title }}</RouterLink>
                  <span v-if="entry.detail" class="text-slate-500 dark:text-slate-400"> ({{ entry.detail }})</span>
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ relativeTime(entry.createdAt) }}</p>
              </div>
            </li>
          </ul>
        </section>

        <div class="space-y-6">
          <!-- Recherche de profils -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <h2 class="text-lg font-bold mb-3">{{ $t('community.find') }}</h2>
            <form class="flex gap-2" @submit.prevent="search">
              <label for="community-search" class="sr-only">{{ $t('community.search_placeholder') }}</label>
              <input id="community-search" v-model="query" :placeholder="$t('community.search_placeholder')" minlength="2"
                     class="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm" />
              <button type="submit" :disabled="searching || query.trim().length < 2"
                      class="px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 disabled:opacity-40 transition">
                <i class="pi pi-search" aria-hidden="true"></i>
              </button>
            </form>

            <p v-if="searched && !results.length" class="text-sm text-slate-500 dark:text-slate-400 mt-3">{{ $t('community.no_result') }}</p>
            <ul v-else-if="results.length" class="mt-4 space-y-3">
              <li v-for="profile in results" :key="profile.username" class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-full bg-violet-500 text-white grid place-items-center text-xs font-bold flex-shrink-0">
                  {{ profile.username.charAt(0).toUpperCase() }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold truncate">{{ profile.username }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ profile.worksTracked === null ? $t('community.private_profile') : $t('community.works', { n: profile.worksTracked }) }}
                  </p>
                </div>
                <button v-if="profile.friendStatus === 'none'" type="button" @click="addFriend(profile)"
                        class="px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 text-xs font-semibold hover:bg-violet-50 dark:hover:bg-violet-900/30 transition flex-shrink-0">
                  {{ $t('community.add') }}
                </button>
                <span v-else class="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{{ $t(`community.status.${profile.friendStatus}`) }}</span>
              </li>
            </ul>
          </section>

          <!-- Demandes reçues -->
          <section v-if="lists.received.length" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <h2 class="text-lg font-bold mb-3">{{ $t('community.requests') }}</h2>
            <ul class="space-y-3">
              <li v-for="profile in lists.received" :key="profile.username" class="flex items-center gap-2">
                <span class="flex-1 min-w-0 text-sm font-semibold truncate">{{ profile.username }}</span>
                <button type="button" @click="acceptFriend(profile)"
                        class="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition">
                  {{ $t('community.accept') }}
                </button>
                <button type="button" @click="removeFriend(profile)" :aria-label="$t('community.decline')"
                        class="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs">
                  <i class="pi pi-times" aria-hidden="true"></i>
                </button>
              </li>
            </ul>
          </section>

          <!-- Amis -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <h2 class="text-lg font-bold mb-3">{{ $t('community.friends') }}</h2>
            <p v-if="!hasFriends" class="text-sm text-slate-500 dark:text-slate-400">{{ $t('community.friends_empty') }}</p>
            <ul v-else class="space-y-3">
              <li v-for="profile in lists.friends" :key="profile.username" class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-violet-500 text-white grid place-items-center text-xs font-bold flex-shrink-0">
                  {{ profile.username.charAt(0).toUpperCase() }}
                </span>
                <span class="flex-1 min-w-0 text-sm truncate">{{ profile.username }}</span>
                <button type="button" @click="removeFriend(profile)" :aria-label="$t('community.remove')"
                        class="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400">
                  <i class="pi pi-user-minus" aria-hidden="true"></i>
                </button>
              </li>
            </ul>

            <p v-if="lists.sent.length" class="text-xs text-slate-500 dark:text-slate-400 mt-4">
              {{ $t('community.pending_sent', { n: lists.sent.length }) }}
            </p>
          </section>

          <!-- Visibilité -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <h2 class="text-lg font-bold mb-1">{{ $t('community.visibility') }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">{{ $t('community.visibility_desc') }}</p>
            <button type="button" @click="toggleVisibility"
                    class="w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition"
                    :class="isPublic
                      ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'">
              {{ isPublic ? $t('community.public') : $t('community.private') }}
            </button>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./Community.ts"></script>
