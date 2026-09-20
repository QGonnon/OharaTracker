<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
    <Menu />

    <div class="max-w-5xl mx-auto px-4 py-12">
      <p v-if="loading" class="text-slate-500 dark:text-slate-400">{{ $t('watchlists.loading') }}</p>

      <div v-else-if="error" role="alert" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
        {{ error }}
      </div>

      <template v-else-if="list">
        <header class="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ list.title }}</h1>
            <p v-if="list.description" class="text-slate-500 dark:text-slate-400 mt-1">{{ list.description }}</p>
            <p class="text-sm text-slate-400 dark:text-slate-500 mt-2">
              {{ $t('watchlists.by', { name: list.owner }) }} · {{ $t('watchlists.works_count', { n: list.works.length }) }} · {{ $t('watchlists.followers', { n: list.followerCount }) }}
            </p>
          </div>

          <RouterLink v-if="!isLoggedIn" :to="loginLink"
                      class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition flex-shrink-0">
            {{ $t('watchlists.login_to_follow') }}
          </RouterLink>
          <RouterLink v-else-if="followed" :to="watchlistsLink"
                      class="px-6 py-2.5 rounded-xl border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 font-semibold text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition flex-shrink-0">
            {{ $t('watchlists.now_following') }}
          </RouterLink>
          <button v-else type="button" :disabled="following" @click="follow"
                  class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition flex-shrink-0">
            {{ following ? $t('watchlists.following_in_progress') : $t('watchlists.follow') }}
          </button>
        </header>

        <ul v-if="list.works.length" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <li v-for="work in list.works" :key="work.idLibrary">
            <RouterLink :to="workLink(work)" class="block group">
              <img :src="coverUrl(work)" :alt="work.title" loading="lazy"
                   class="w-full aspect-[2/3] object-cover rounded-xl border border-slate-200 dark:border-slate-700 group-hover:border-indigo-400 transition" />
              <span class="block text-sm mt-2 line-clamp-2 text-slate-700 dark:text-slate-300">{{ work.title }}</span>
            </RouterLink>
          </li>
        </ul>
        <p v-else class="text-slate-500 dark:text-slate-400">{{ $t('watchlists.empty_list') }}</p>
      </template>
    </div>
  </div>
</template>

<script src="./SharedWatchlist.ts"></script>
