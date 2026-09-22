<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
    <Menu />

    <div class="max-w-5xl mx-auto px-4 py-12">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ $t('watchlists.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">{{ $t('watchlists.subtitle') }}</p>
      </header>

      <div v-if="error" role="alert" class="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
        {{ error }}
      </div>

      <!-- Création -->
      <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-8">
        <h2 class="text-lg font-bold mb-4">{{ $t('watchlists.create') }}</h2>
        <form class="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" @submit.prevent="create">
          <div>
            <label for="wl-title" class="sr-only">{{ $t('watchlists.name') }}</label>
            <input id="wl-title" v-model="newTitle" :placeholder="$t('watchlists.name')" maxlength="80" required
                   class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label for="wl-desc" class="sr-only">{{ $t('watchlists.description') }}</label>
            <input id="wl-desc" v-model="newDescription" :placeholder="$t('watchlists.description')" maxlength="300"
                   class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
          </div>
          <button type="submit" :disabled="creating || quotaReached || !newTitle.trim()"
                  class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            {{ creating ? $t('watchlists.creating') : $t('watchlists.add') }}
          </button>
        </form>
        <p v-if="quotaReached" class="text-sm text-slate-500 dark:text-slate-400 mt-3">
          {{ quotas.owned === 0 ? $t('watchlists.quota_none') : $t('watchlists.quota_reached', { n: quotas.owned }) }}
          <RouterLink :to="pricingLink" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">{{ $t('watchlists.see_plans') }}</RouterLink>
        </p>
      </section>

      <p v-if="loading" class="text-slate-500 dark:text-slate-400">{{ $t('watchlists.loading') }}</p>

      <template v-else>
        <!-- Mes listes -->
        <section class="mb-10">
          <h2 class="text-lg font-bold mb-4">{{ $t('watchlists.mine') }}</h2>
          <p v-if="!owned.length" class="text-sm text-slate-500 dark:text-slate-400">{{ $t('watchlists.empty_mine') }}</p>

          <article v-for="list in owned" :key="list.id"
                   class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-bold text-slate-900 dark:text-white">{{ list.title }}</h3>
                <p v-if="list.description" class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ list.description }}</p>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {{ $t('watchlists.works_count', { n: list.works.length }) }} · {{ $t('watchlists.followers', { n: list.followerCount }) }}
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button type="button" @click="toggleSharing(list)"
                        class="px-4 py-2 rounded-xl border text-sm font-semibold transition"
                        :class="list.isPublic
                          ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'">
                  <i class="pi mr-1.5 text-xs" :class="list.isPublic ? 'pi-lock-open' : 'pi-lock'" aria-hidden="true"></i>
                  {{ list.isPublic ? $t('watchlists.shared') : $t('watchlists.share') }}
                </button>
                <button type="button" @click="remove(list)" :aria-label="$t('watchlists.delete')"
                        class="px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  <i class="pi pi-trash" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <div v-if="list.isPublic && list.shareToken" class="mt-3 flex items-center gap-2">
              <code class="flex-1 min-w-0 truncate text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">{{ shareUrl(list) }}</code>
              <button type="button" @click="copyShareUrl(list)"
                      class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex-shrink-0">
                {{ copiedId === list.id ? $t('watchlists.copied') : $t('watchlists.copy') }}
              </button>
            </div>

            <ul v-if="list.works.length" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
              <li v-for="work in list.works" :key="work.idLibrary" class="relative group">
                <RouterLink :to="workLink(work)" class="block">
                  <img :src="coverUrl(work)" :alt="work.title" loading="lazy"
                       class="w-full aspect-[2/3] object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                  <span class="block text-xs mt-1 line-clamp-2 text-slate-600 dark:text-slate-300">{{ work.title }}</span>
                </RouterLink>
                <button type="button" @click="removeWork(list, work.idLibrary)" :aria-label="$t('watchlists.remove_work')"
                        class="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition">
                  <i class="pi pi-times" aria-hidden="true"></i>
                </button>
              </li>
            </ul>
            <p v-else class="text-sm text-slate-500 dark:text-slate-400 mt-4">
              {{ $t('watchlists.empty_list') }}
              <RouterLink :to="libraryLink" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">{{ $t('watchlists.go_library') }}</RouterLink>
            </p>
          </article>
        </section>

        <!-- Listes suivies -->
        <section>
          <h2 class="text-lg font-bold mb-4">{{ $t('watchlists.followed') }}</h2>
          <p v-if="!followed.length" class="text-sm text-slate-500 dark:text-slate-400">{{ $t('watchlists.empty_followed') }}</p>

          <article v-for="list in followed" :key="list.id"
                   class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 mb-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-bold text-slate-900 dark:text-white">{{ list.title }}</h3>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {{ $t('watchlists.by', { name: list.owner }) }} · {{ $t('watchlists.works_count', { n: list.works.length }) }}
                </p>
              </div>
              <button type="button" @click="unfollow(list)"
                      class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex-shrink-0">
                {{ $t('watchlists.unfollow') }}
              </button>
            </div>

            <ul v-if="list.works.length" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
              <li v-for="work in list.works" :key="work.idLibrary">
                <RouterLink :to="workLink(work)" class="block">
                  <img :src="coverUrl(work)" :alt="work.title" loading="lazy"
                       class="w-full aspect-[2/3] object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                  <span class="block text-xs mt-1 line-clamp-2 text-slate-600 dark:text-slate-300">{{ work.title }}</span>
                </RouterLink>
              </li>
            </ul>
          </article>
        </section>
      </template>
    </div>
  </div>
</template>

<script src="./Watchlists.ts"></script>
