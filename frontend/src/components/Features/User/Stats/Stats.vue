<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
    <Menu />

    <div class="max-w-5xl mx-auto px-4 py-12">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ $t('stats.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">{{ $t('stats.subtitle') }}</p>
      </header>

      <p v-if="loading" class="text-slate-500 dark:text-slate-400">{{ $t('stats.loading') }}</p>

      <div v-else-if="error" role="alert" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
        {{ error }}
      </div>

      <template v-else-if="stats">
        <!-- Filtres (offre Pro) -->
        <form v-if="stats.filtersUnlocked" class="flex flex-wrap items-end gap-3 mb-8" @submit.prevent="load">
          <div>
            <label for="stats-type" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('stats.filter_type') }}</label>
            <select id="stats-type" v-model="filterType" class="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm">
              <option value="">{{ $t('stats.all_types') }}</option>
              <option value="Manga">Manga</option>
              <option value="Anime">Anime</option>
            </select>
          </div>
          <div>
            <label for="stats-since" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('stats.filter_since') }}</label>
            <input id="stats-since" v-model="filterSince" type="date" class="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm" />
          </div>
          <button type="submit" class="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition">
            {{ $t('stats.apply') }}
          </button>
        </form>

        <!-- Compteurs -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ stats.worksTracked }}</p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ $t('stats.works_tracked') }}</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ stats.chaptersRead }}</p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ $t('stats.chapters_read') }}</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ stats.episodesWatched }}</p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ $t('stats.episodes_watched') }}</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ stats.averageScore ?? '—' }}</p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ $t('stats.average_score', { n: stats.ratedCount }) }}</p>
          </div>
        </div>

        <!-- Badges -->
        <section v-if="badges.length" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-6">
          <h2 class="text-lg font-bold mb-4">{{ $t('stats.badges') }}</h2>
          <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <li v-for="badge in badges" :key="badge.key"
                class="rounded-xl border p-4" :class="tierClass(badge.tier)">
              <p class="font-bold text-sm">{{ $t(`stats.badge.${badge.key}`) }}</p>
              <p class="text-xs mt-0.5 opacity-80">
                {{ badge.tier ? $t(`stats.tier.${badge.tier}`) : $t('stats.badge_locked') }}
              </p>
              <div class="mt-2 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <span class="block h-full rounded-full bg-current opacity-70" :style="{ width: badge.progress + '%' }"></span>
              </div>
              <p class="text-xs mt-1 tabular-nums opacity-80">
                {{ badge.next ? `${badge.value} / ${badge.next}` : badge.value }}
              </p>
            </li>
          </ul>
        </section>

        <!-- Classement entre amis -->
        <section v-if="ranking.length > 1" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-6">
          <h2 class="text-lg font-bold mb-1">{{ $t('stats.ranking') }}</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">{{ $t('stats.ranking_desc') }}</p>
          <ol class="space-y-2">
            <li v-for="row in ranking" :key="row.username"
                class="flex items-center gap-3 px-3 py-2 rounded-xl"
                :class="row.isMe ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''">
              <span class="w-6 text-sm font-bold tabular-nums text-slate-500 dark:text-slate-400">{{ row.rank }}</span>
              <span class="flex-1 min-w-0 truncate text-sm" :class="row.isMe ? 'font-bold' : ''">{{ row.username }}</span>
              <span class="text-sm tabular-nums text-slate-600 dark:text-slate-300">{{ row.worksTracked }}</span>
            </li>
          </ol>
        </section>

        <!-- Répartition par statut -->
        <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-6">
          <h2 class="text-lg font-bold mb-1">{{ $t('stats.by_status') }}</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">{{ $t('stats.completion', { n: completionRate }) }}</p>
          <ul class="space-y-3">
            <li v-for="row in stats.byStatus" :key="row.label" class="flex items-center gap-3">
              <span class="w-28 flex-shrink-0 text-sm text-slate-600 dark:text-slate-300">
                {{ statusKey(row.label) ? $t(`library.status.${statusKey(row.label)}`) : row.label }}
              </span>
              <span class="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <span class="block h-full rounded-full bg-indigo-500" :style="{ width: ratio(row.count, maxStatus) + '%' }"></span>
              </span>
              <span class="w-10 text-right text-sm font-semibold tabular-nums">{{ row.count }}</span>
            </li>
          </ul>
        </section>

        <!-- Bloc avancé -->
        <template v-if="stats.advanced">
          <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-6">
            <h2 class="text-lg font-bold mb-4">{{ $t('stats.top_genres') }}</h2>
            <p v-if="!stats.advanced.topGenres.length" class="text-sm text-slate-500 dark:text-slate-400">{{ $t('stats.empty') }}</p>
            <ul v-else class="space-y-3">
              <li v-for="row in stats.advanced.topGenres" :key="row.label" class="flex items-center gap-3">
                <span class="w-32 flex-shrink-0 text-sm text-slate-600 dark:text-slate-300 truncate" :title="row.label">{{ row.label }}</span>
                <span class="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <span class="block h-full rounded-full bg-violet-500" :style="{ width: ratio(row.count, maxGenre) + '%' }"></span>
                </span>
                <span class="w-10 text-right text-sm font-semibold tabular-nums">{{ row.count }}</span>
              </li>
            </ul>
          </section>

          <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-6">
            <h2 class="text-lg font-bold mb-4">{{ $t('stats.activity') }}</h2>
            <p v-if="!stats.advanced.monthlyActivity.length" class="text-sm text-slate-500 dark:text-slate-400">{{ $t('stats.empty') }}</p>
            <div v-else class="flex items-end gap-1.5 h-40 overflow-x-auto">
              <div v-for="row in stats.advanced.monthlyActivity" :key="row.month" class="flex flex-col items-center gap-1 flex-1 min-w-[38px]">
                <span class="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{{ row.count }}</span>
                <span
                  class="w-full rounded-t bg-indigo-500/80"
                  :style="{ height: Math.max(4, ratio(row.count, maxMonth)) + '%' }"
                  :title="`${row.month}: ${row.count}`"
                ></span>
                <span class="text-[10px] text-slate-400 dark:text-slate-500">{{ row.month.slice(2) }}</span>
              </div>
            </div>
          </section>

          <section class="grid md:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
              <h2 class="text-lg font-bold mb-4">{{ $t('stats.score_distribution') }}</h2>
              <p v-if="!stats.advanced.scoreDistribution.length" class="text-sm text-slate-500 dark:text-slate-400">{{ $t('stats.empty') }}</p>
              <ul v-else class="space-y-2">
                <li v-for="row in stats.advanced.scoreDistribution" :key="row.score" class="flex items-center gap-3">
                  <span class="w-8 text-sm tabular-nums">{{ row.score }}</span>
                  <span class="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <span class="block h-full rounded-full bg-amber-500" :style="{ width: ratio(row.count, maxScore) + '%' }"></span>
                  </span>
                  <span class="w-8 text-right text-sm tabular-nums">{{ row.count }}</span>
                </li>
              </ul>
            </div>

            <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
              <h2 class="text-lg font-bold mb-4">{{ $t('stats.top_rated') }}</h2>
              <p v-if="!stats.advanced.topRated.length" class="text-sm text-slate-500 dark:text-slate-400">{{ $t('stats.empty') }}</p>
              <ol v-else class="space-y-2">
                <li v-for="work in stats.advanced.topRated" :key="work.title" class="flex items-center justify-between gap-3 text-sm">
                  <span class="truncate" :title="work.title">{{ work.title }}</span>
                  <span class="font-semibold text-amber-600 dark:text-amber-400 tabular-nums flex-shrink-0">
                    <i class="pi pi-star-fill text-xs mr-1" aria-hidden="true"></i>{{ work.score }}
                  </span>
                </li>
              </ol>
            </div>
          </section>
        </template>

        <!-- Invitation à passer premium -->
        <section v-else class="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-6 text-center">
          <h2 class="text-lg font-bold text-violet-900 dark:text-violet-200">{{ $t('stats.locked_title') }}</h2>
          <p class="text-sm text-violet-700 dark:text-violet-300 mt-1 mb-4">{{ $t('stats.locked_desc') }}</p>
          <RouterLink :to="pricingLink" class="inline-block px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition">
            {{ $t('stats.see_plans') }}
          </RouterLink>
        </section>
      </template>
    </div>
  </div>
</template>

<script src="./Stats.ts"></script>
