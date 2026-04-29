<template>
  <Menu />
  <div id="MangaList">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <h1 class="text-4xl font-bold text-slate-900 dark:text-white mb-6">{{ $t('latest.title') }}</h1>

      <!-- Filter Buttons -->
      <div class="mb-6 flex items-center gap-4">
        <label class="text-sm text-slate-500 dark:text-slate-400">{{ $t('latest.filter') }}</label>
        <Button
          :label="$t('latest.all')"
          :severity="filterType === 'all' ? 'info' : 'secondary'"
          class="!px-3"
          text
          rounded
          @click="filterType = filterType === 'all' ? 'all' : 'all'"
        />
        <Button
          :label="$t('latest.anime')"
          :severity="filterType === 'anime' ? 'info' : 'secondary'"
          class="!px-3"
          text
          rounded
          @click="filterType = filterType === 'anime' ? 'all' : 'anime'"
        />
        <Button
          :label="$t('latest.reading')"
          :severity="filterType === 'lecture' ? 'info' : 'secondary'"
          class="!px-3"
          text
          rounded
          @click="filterType = filterType === 'lecture' ? 'all' : 'lecture'"
        />
      </div>

      <div class="container">
        <div v-if="loading">{{ $t('latest.loading') }}</div>
        <div v-else-if="displayedMangas.length === 0" class="text-center py-12">
          <i class="pi pi-inbox text-5xl text-slate-300 dark:text-slate-600 mb-4"></i>
          <p class="text-lg text-slate-600 dark:text-slate-400">
            <span v-if="filterType === 'anime'">{{ $t('latest.empty_anime') }}</span>
            <span v-else-if="filterType === 'lecture'">{{ $t('latest.empty_reading') }}</span>
          </p>
        </div>
        <div v-else v-for="manga in displayedMangas" :key="manga.id" class="mb-6 max-w-xs">
          <MangaCard :manga="manga" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('./MangasCoverView.css');
</style>

<script src="./MangasCoverView.ts">
</script>
