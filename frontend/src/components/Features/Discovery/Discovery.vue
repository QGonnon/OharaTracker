<template>
  <Menu />

  <!-- Titre de page inconditionnel : le h1 ne peut pas dependre du chargement. -->
  <h1 class="sr-only">{{ $t('seo.discovery.title') }}</h1>

  <!-- SPOTLIGHT avec PrimeVue Card -->
  <div v-if="spotlightItem && !loading && !discoveryPrefs?.hideSpotlight" class="w-full flex justify-center items-center min-h-[480px] relative overflow-hidden bg-gradient-to-br from-violet-600/60 to-violet-900/80">
    <!-- Backdrop (en dessous) -->
    <div class="absolute inset-0" :style="{ backgroundImage: `url(${getCoverUrl(spotlightItem)})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.35) saturate(1.4)' }"></div>
    <!-- Overlay -->
    <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/80"></div>
    <!-- Contenu principal -->
    <div class="flex flex-col md:flex-row items-center gap-8 p-8 max-w-5xl w-full relative">
      <div class="flex-shrink-0">
        <img :src="getCoverUrl(spotlightItem)" alt="" width="400" height="600" fetchpriority="high" decoding="async" class="rounded-xl shadow-2xl w-44 md:w-56 aspect-[3/4] object-cover" />
      </div>
      <div class="flex flex-col gap-3 text-white max-w-xl">
        <div class="flex flex-wrap gap-2">
          <span :class="isAnime(spotlightItem) ? 'bg-red-200 text-red-600' : 'bg-violet-200 text-violet-700'" class="px-3 py-1 rounded-full text-xs font-bold uppercase">
            {{ isAnime(spotlightItem) ? 'Anime' : 'Manga' }}
          </span>
          <span v-for="tag in getThemeTags(spotlightItem)" :key="tag" class="bg-white/20 border border-white/30 text-white/80 px-2 py-1 rounded-full text-xs font-medium">
            {{ tag }}
          </span>
        </div>
        <h2 class="text-3xl md:text-4xl font-extrabold drop-shadow-lg">{{ spotlightItem.title }}</h2>
        <p v-if="spotlightItem.description" class="text-white/80 text-sm md:text-base line-clamp-4">{{ truncate(spotlightItem.description, 180) }}</p>
        <div v-if="spotlightItem.status" class="flex gap-2 mt-1">
          <span class="bg-emerald-200 text-emerald-700 border border-emerald-300 rounded-full px-3 py-1 text-xs font-semibold">
            {{ spotlightItem.status }}
          </span>
        </div>
        <div class="flex gap-3 mt-2">
          <RouterLink :to="workPath(spotlightItem)" class="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold shadow-lg hover:scale-105 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {{ isAnime(spotlightItem) ? $t('discovery.watch') : $t('discovery.read_now') }}
          </RouterLink>
          <RouterLink :to="workPath(spotlightItem)" class="inline-flex items-center px-6 py-2 rounded-full border border-white/30 text-white font-bold hover:bg-white/10 transition">
            {{ $t('discovery.details') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>

  <!-- Skeleton -->
  <div v-if="loading" class="w-full h-[480px] bg-slate-200 animate-pulse rounded-xl my-4"></div>

  <!-- BODY -->
  <div class="bg-slate-50 dark:bg-slate-900 min-h-[60vh] pb-16">
    <!-- FILTER BAR -->
    <div class="sticky top-16 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 backdrop-blur flex flex-col gap-2 px-8 py-3">
      <div class="flex gap-2 items-center">
        <button v-for="t in types" :key="t.value" type="button" :aria-pressed="activeType === t.value" @click="setType(t.value)" :class="['px-4 py-1.5 rounded-full font-semibold text-sm transition', activeType === t.value ? 'bg-violet-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-violet-100 dark:hover:bg-violet-900']">
          {{ t.label }}
        </button>

        <button v-if="canCustomize" type="button" @click="openCustomizer"
                class="ml-auto px-4 py-1.5 rounded-full text-sm font-semibold border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition">
          <i class="pi pi-sliders-h mr-1.5 text-xs" aria-hidden="true"></i>{{ $t('discovery.customize') }}
        </button>
      </div>

      <!-- Personnalisation de la page (offre Pro) -->
      <form v-if="customizerOpen && discoveryPrefs" class="rounded-xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-800 p-4 mt-2 grid gap-3 sm:grid-cols-2"
            @submit.prevent="saveDiscoveryPrefs">
        <div>
          <label for="disc-type" class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">{{ $t('discovery.default_type') }}</label>
          <select id="disc-type" v-model="discoveryPrefs.defaultType"
                  class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm">
            <option value="all">{{ $t('discovery.all') }}</option>
            <option value="manga">Manga</option>
            <option value="anime">Anime</option>
          </select>
        </div>
        <div class="flex flex-col justify-center gap-2">
          <div class="flex items-center gap-2">
            <input id="disc-hide-spotlight" type="checkbox" v-model="discoveryPrefs.hideSpotlight" class="accent-violet-600" />
            <label for="disc-hide-spotlight" class="text-sm text-slate-700 dark:text-slate-200">{{ $t('discovery.hide_spotlight') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <input id="disc-hide-trending" type="checkbox" v-model="discoveryPrefs.hideTrending" class="accent-violet-600" />
            <label for="disc-hide-trending" class="text-sm text-slate-700 dark:text-slate-200">{{ $t('discovery.hide_trending') }}</label>
          </div>
        </div>
        <div class="sm:col-span-2 flex justify-end gap-2">
          <button type="button" @click="customizerOpen = false"
                  class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm">{{ $t('discovery.cancel') }}</button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition">
            {{ $t('discovery.save') }}
          </button>
        </div>
      </form>
    </div>

    <!-- SUGGESTIONS PERSONNALISÉES -->
    <section v-if="isLoggedIn && (suggestions.length || suggestionsLocked)" class="px-8 pt-10">
      <div class="flex items-center gap-3 mb-1">
        <span class="w-1 h-6 rounded bg-gradient-to-b from-violet-500 to-pink-400"></span>
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t('discovery.for_you') }}</h2>
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 ml-4">
        {{ suggestionsFallback ? $t('discovery.for_you_popular') : $t('discovery.for_you_desc') }}
      </p>

      <div v-if="suggestionsLocked" class="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-6 text-center">
        <p class="text-sm text-violet-800 dark:text-violet-200 mb-3">{{ $t('discovery.for_you_locked') }}</p>
        <RouterLink :to="pricingLink" class="inline-block px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition">
          {{ $t('discovery.see_plans') }}
        </RouterLink>
      </div>

      <div v-else class="flex gap-4 overflow-x-auto pb-2">
        <RouterLink
          v-for="item in suggestions"
          :key="item.id"
          :to="suggestionPath(item)"
          class="flex-shrink-0 w-36 group"
        >
          <img :src="suggestionCover(item)" :alt="item.title" loading="lazy"
               class="w-full aspect-[2/3] object-cover rounded-xl border border-slate-200 dark:border-slate-700 group-hover:border-violet-400 transition" />
          <span class="block text-sm font-semibold mt-2 line-clamp-2 text-slate-800 dark:text-slate-200">{{ item.title }}</span>
          <span v-if="item.genres.length" class="block text-xs text-slate-600 dark:text-slate-300 line-clamp-1">{{ item.genres.join(' · ') }}</span>
        </RouterLink>
      </div>
    </section>

    <!-- TRENDING STRIP -->
    <section v-if="trending.length && activeGenre === '' && activeType === 'all' && !discoveryPrefs?.hideTrending" class="px-8 pt-10">
      <div class="flex items-center gap-3 mb-4">
        <span class="w-1 h-6 rounded bg-gradient-to-b from-violet-500 to-pink-400"></span>
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t('discovery.trending') }}</h2>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2">
        <RouterLink v-for="(item, i) in trending" :key="item.title" :to="workPath(item)" class="flex items-center gap-3 min-w-[180px] max-w-[220px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:shadow-lg transition">
          <span :class="['font-extrabold text-xl', Number(i) < 3 ? 'bg-gradient-to-r from-violet-500 to-pink-400 bg-clip-text text-transparent' : 'text-slate-600']">{{ String(Number(i) + 1).padStart(2, '0') }}</span>
          <div class="w-9 h-12 rounded overflow-hidden flex-shrink-0">
            <img :src="getCoverUrl(item)" :alt="item.title" width="400" height="600" loading="lazy" decoding="async" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="truncate font-semibold text-sm text-slate-900 dark:text-white">{{ item.title }}</p>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- MAIN GRID -->
    <section class="px-8 pt-10">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
          <span class="w-1 h-6 rounded bg-gradient-to-b from-violet-500 to-pink-400"></span>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t(sectionTitle) }}</h2>
          <span v-if="!loading" class="ml-2 text-xs bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full">{{ filteredItems.length }}</span>
        </div>
        <div class="flex gap-2">
          <button type="button" :aria-pressed="sortBy === 'latest'" @click="sortBy = 'latest'" :class="['px-3 py-1 rounded-full text-xs font-semibold transition', sortBy === 'latest' ? 'bg-violet-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-violet-100 dark:hover:bg-violet-900']">{{ $t('discovery.recent') }}</button>
          <button type="button" :aria-pressed="sortBy === 'alpha'" @click="sortBy = 'alpha'" :class="['px-3 py-1 rounded-full text-xs font-semibold transition', sortBy === 'alpha' ? 'bg-violet-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-violet-100 dark:hover:bg-violet-900']">{{ $t('discovery.a_to_z') }}</button>
        </div>
      </div>
      <!-- Skeleton loader -->
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div v-for="n in 15" :key="n" class="flex flex-col gap-2 animate-pulse">
          <div class="aspect-[3/4] rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div class="h-3 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div class="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>
      <!-- Empty state -->
      <div v-else-if="filteredItems.length === 0" class="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span class="text-4xl">🔍</span>
        <p class="text-slate-500 dark:text-slate-300">{{ $t('discovery.empty') }}</p>
        <button @click="resetFilters" class="px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-violet-100 dark:hover:bg-violet-900 transition">{{ $t('discovery.reset_filters') }}</button>
      </div>
      <!-- Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        <div v-for="item in filteredItems" :key="item.title" class="flex flex-col gap-4 my-2">
          <RouterLink :to="workPath(item)" class="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group block">
            <img :src="getCoverUrl(item)" :alt="item.title" width="400" height="600" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-3 transition-opacity duration-200">
              <p class="text-white font-semibold text-sm truncate mb-2">{{ item.title }}</p>
            </div>
            <span :class="isAnime(item) ? 'bg-red-500' : 'bg-violet-500'" class="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-extrabold text-white">{{ isAnime(item) ? 'A' : 'M' }}</span>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import url('./Discovery.css');
</style>

<script src="./Discovery.ts">
</script>
