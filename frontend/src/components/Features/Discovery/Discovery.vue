<template>
  <Menu />

  <!-- SPOTLIGHT avec PrimeVue Card -->
  <div v-if="spotlightItem && !loading" class="w-full flex justify-center items-center min-h-[480px] relative overflow-hidden bg-gradient-to-br from-violet-600/60 to-indigo-900/80">
    <!-- Backdrop (en dessous) -->
    <div class="absolute inset-0" :style="{ backgroundImage: `url(${getCoverUrl(spotlightItem)})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.35) saturate(1.4)' }"></div>
    <!-- Overlay -->
    <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-black/80"></div>
    <!-- Contenu principal -->
    <div class="flex flex-col md:flex-row items-center gap-8 p-8 max-w-5xl w-full relative">
      <div class="flex-shrink-0">
        <img :src="getCoverUrl(spotlightItem)" :alt="spotlightItem.title" class="rounded-xl shadow-2xl w-44 md:w-56 aspect-[3/4] object-cover" />
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
        <h1 class="text-3xl md:text-4xl font-extrabold drop-shadow-lg">{{ spotlightItem.title }}</h1>
        <p v-if="spotlightItem.description" class="text-white/80 text-sm md:text-base line-clamp-4">{{ truncate(spotlightItem.description, 180) }}</p>
        <div v-if="spotlightItem.status" class="flex gap-2 mt-1">
          <span class="bg-emerald-200 text-emerald-700 border border-emerald-300 rounded-full px-3 py-1 text-xs font-semibold">
            {{ spotlightItem.status }}
          </span>
        </div>
        <div class="flex gap-3 mt-2">
          <RouterLink :to="isAnime(spotlightItem) ? `/anime/${slugify(spotlightItem.title)}` : `/manga/${slugify(spotlightItem.title)}`" class="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold shadow-lg hover:scale-105 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {{ isAnime(spotlightItem) ? $t('discovery.watch') : $t('discovery.read_now') }}
          </RouterLink>
          <RouterLink :to="isAnime(spotlightItem) ? `/anime/${slugify(spotlightItem.title)}` : `/manga/${slugify(spotlightItem.title)}`" class="inline-flex items-center px-6 py-2 rounded-full border border-white/30 text-white font-bold hover:bg-white/10 transition">
            {{ $t('discovery.details') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>

  <!-- Skeleton -->
  <div v-if="loading" class="w-full h-[480px] bg-gray-200 animate-pulse rounded-xl my-4"></div>

  <!-- BODY -->
  <div class="bg-gray-50 dark:bg-gray-900 min-h-[60vh] pb-16">
    <!-- FILTER BAR -->
    <div class="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 backdrop-blur flex flex-col gap-2 px-8 py-3">
      <div class="flex gap-2">
        <button v-for="t in types" :key="t.value" @click="setType(t.value)" :class="['px-4 py-1.5 rounded-full font-semibold text-sm transition', activeType === t.value ? 'bg-violet-500 text-white shadow' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-violet-900']">
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- TRENDING STRIP -->
    <section v-if="trending.length && activeGenre === '' && activeType === 'all'" class="px-8 pt-10">
      <div class="flex items-center gap-3 mb-4">
        <span class="w-1 h-6 rounded bg-gradient-to-b from-violet-500 to-pink-400"></span>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t('discovery.trending') }}</h2>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2">
        <RouterLink v-for="(item, i) in trending" :key="item.title" :to="isAnime(item) ? `/anime/${slugify(item.title)}` : `/manga/${slugify(item.title)}`" class="flex items-center gap-3 min-w-[180px] max-w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 hover:shadow-lg transition">
          <span :class="['font-extrabold text-xl', Number(i) < 3 ? 'bg-gradient-to-r from-violet-500 to-pink-400 bg-clip-text text-transparent' : 'text-gray-400']">{{ String(Number(i) + 1).padStart(2, '0') }}</span>
          <div class="w-9 h-12 rounded overflow-hidden flex-shrink-0">
            <img :src="getCoverUrl(item)" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="truncate font-semibold text-sm text-gray-900 dark:text-white">{{ item.title }}</p>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- MAIN GRID -->
    <section class="px-8 pt-10">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
          <span class="w-1 h-6 rounded bg-gradient-to-b from-violet-500 to-pink-400"></span>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t(sectionTitle) }}</h2>
          <span v-if="!loading" class="ml-2 text-xs bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-300 px-2 py-0.5 rounded-full">{{ filteredItems.length }}</span>
        </div>
        <div class="flex gap-2">
          <button @click="sortBy = 'latest'" :class="['px-3 py-1 rounded-full text-xs font-semibold transition', sortBy === 'latest' ? 'bg-violet-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-violet-900']">{{ $t('discovery.recent') }}</button>
          <button @click="sortBy = 'alpha'" :class="['px-3 py-1 rounded-full text-xs font-semibold transition', sortBy === 'alpha' ? 'bg-violet-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-violet-900']">{{ $t('discovery.a_to_z') }}</button>
        </div>
      </div>
      <!-- Skeleton loader -->
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div v-for="n in 15" :key="n" class="flex flex-col gap-2 animate-pulse">
          <div class="aspect-[3/4] rounded-xl bg-gray-200 dark:bg-gray-800"></div>
          <div class="h-3 rounded bg-gray-200 dark:bg-gray-800"></div>
          <div class="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800"></div>
        </div>
      </div>
      <!-- Empty state -->
      <div v-else-if="filteredItems.length === 0" class="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span class="text-4xl">🔍</span>
        <p class="text-gray-500 dark:text-gray-300">{{ $t('discovery.empty') }}</p>
        <button @click="resetFilters" class="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-violet-900 transition">{{ $t('discovery.reset_filters') }}</button>
      </div>
      <!-- Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        <div v-for="item in filteredItems" :key="item.title" class="flex flex-col gap-4 my-2">
          <RouterLink :to="isAnime(item) ? `/anime/${slugify(item.title)}` : `/manga/${slugify(item.title)}`" class="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group block">
            <img :src="getCoverUrl(item)" :alt="item.title" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
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
