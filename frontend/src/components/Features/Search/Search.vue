<template>
  <Menu />
  <div class="search-page min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="container mx-auto px-4 max-w-7xl">
      <!-- Header Section -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {{ $t('search.title') }}
        </h1>
        <p class="text-gray-600 dark:text-gray-600">
          {{ $t('search.subtitle') }}
        </p>
      </div>

      <!-- Search Bar -->
      <div class="mb-8">
        <form class="flex gap-4" role="search" @submit.prevent="performSearch">
          <div class="p-input-icon-left flex-1">
            <label for="search-query" class="sr-only">{{ $t('search.label') }}</label>
            <InputText
              id="search-query"
              v-model="searchQuery"
              type="search"
              :placeholder="$t('search.placeholder')"
              class="w-full"
            />
          </div>
          <Button
            type="submit"
            :label="$t('search.search_btn')"
            icon="pi pi-search"
            :loading="isLoading"
            class="px-8"
          />
        </form>
      </div>

      <!-- Filters Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            <i class="pi pi-filter mr-2" aria-hidden="true"></i>{{ $t('search.filters') }}
          </h2>
          <Button
            :label="$t('search.reset')"
            icon="pi pi-refresh"
            text
            @click="resetFilters"
          />
        </div>

        <!-- Type Filter -->
        <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <span id="filter-type-label" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 block">
            {{ $t('search.filter_type') }}
          </span>
          <div class="flex gap-2" role="group" aria-labelledby="filter-type-label">
            <Button
              :label="$t('search.all')"
              :severity="filterType === 'all' ? 'info' : 'secondary'"
              :aria-pressed="filterType === 'all'"
              class="!px-3"
              text
              rounded
              @click="filterType = 'all'"
            />
            <Button
              :label="$t('search.series')"
              :severity="filterType === 'anime' ? 'info' : 'secondary'"
              :aria-pressed="filterType === 'anime'"
              class="!px-3"
              text
              rounded
              @click="filterType = filterType === 'anime' ? 'all' : 'anime'"
            />
            <Button
              :label="$t('search.reading')"
              :severity="filterType === 'lecture' ? 'info' : 'secondary'"
              :aria-pressed="filterType === 'lecture'"
              class="!px-3"
              text
              rounded
              @click="filterType = filterType === 'lecture' ? 'all' : 'lecture'"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Genre Filter -->
          <div class="flex flex-col">
            <label for="genre" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('search.genre') }}
            </label>
            <MultiSelect
              id="genre"
              v-model="selectedGenres"
              :options="genres"
              :placeholder="$t('search.select_genres')"
              :maxSelectedLabels="2"
              class="w-full"
              display="chip"
            />
          </div>

          <!-- Status Filter -->
          <div class="flex flex-col">
            <label for="status" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('search.status') }}
            </label>
            <Select
              id="status"
              v-model="selectedStatus"
              :options="statusOptions"
              :placeholder="$t('search.all_statuses')"
              class="w-full"
            />
          </div>

          <!-- Sort By -->
          <div class="flex flex-col">
            <label for="sortBy" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('search.sort_by') }}
            </label>
            <Select
              id="sortBy"
              v-model="sortBy"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="$t('search.popularity')"
              class="w-full"
            />
          </div>

          <!-- Year Filter -->
          <div class="flex flex-col">
            <label for="year" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('search.year') }}
            </label>
            <InputNumber
              id="year"
              v-model="selectedYear"
              :placeholder="$t('search.all_years')"
              :useGrouping="false"
              :min="1950"
              :max="2025"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="flex items-center justify-between mb-6">
        <div class="text-gray-700 dark:text-gray-300" role="status" aria-live="polite" aria-atomic="true">
          <span class="font-semibold">{{ totalResults }}</span> {{ $t('search.results_label') }}
        </div>
        <div class="flex gap-2">
          <Button
            icon="pi pi-th-large"
            :outlined="viewMode !== 'grid'"
            :aria-label="$t('search.grid_view')"
            :aria-pressed="viewMode === 'grid'"
            @click="viewMode = 'grid'"
          />
          <Button
            icon="pi pi-list"
            :outlined="viewMode !== 'list'"
            :aria-label="$t('search.list_view')"
            :aria-pressed="viewMode === 'list'"
            @click="viewMode = 'list'"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" role="status" aria-live="polite" class="flex justify-center items-center py-20">
        <ProgressSpinner aria-hidden="true" />
        <span class="sr-only">{{ $t('search.loading') }}</span>
      </div>

      <!-- No Results -->
      <div v-else-if="!isLoading && searchResults.length === 0 && hasSearched" class="text-center py-20">
        <i class="pi pi-search text-6xl text-gray-600 mb-4" aria-hidden="true"></i>
        <h3 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('search.no_results') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-600">
          {{ $t('search.modify_criteria') }}
        </p>
      </div>

      <!-- Results - Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div
          v-for="manga in visibleResults"
          :key="manga.id"
          class="manga-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          role="link"
          tabindex="0"
          @click="goToManga(manga)"
          @keydown.enter="goToManga(manga)"
          @keydown.space.prevent="goToManga(manga)"
        >
          <div class="aspect-[3/4] overflow-hidden">
            <img
              :src="getCoverUrl(manga)"
              alt=""
              class="w-full h-full object-cover hover:scale-110 transition-transform duration-300" width="400" height="600" loading="lazy" decoding="async" />
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {{ manga.title }}
            </h3>
            <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-600">
              <span class="flex items-center" v-if="manga.lastChapter">
                <i class="pi pi-book mr-1" aria-hidden="true"></i>
                {{ (manga.type && manga.type.toString().toLowerCase() === 'anime') ? 'S' + manga.lastChapter.split('.')[0] + 'E' + manga.lastChapter.split('.')[1] : 'Ch.' + manga.lastChapter.split('.')[0]}}
              </span>
              <Tag v-if="manga.status" :value="manga.status" :severity="getStatusSeverity(manga.status)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Results - List View -->
      <div v-else-if="viewMode === 'list'" class="space-y-4">
        <div
          v-for="manga in visibleResults"
          :key="manga.id"
          class="manga-card-list bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow duration-300 cursor-pointer flex gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          role="link"
          tabindex="0"
          @click="goToManga(manga)"
          @keydown.enter="goToManga(manga)"
          @keydown.space.prevent="goToManga(manga)"
        >
          <div class="w-24 h-32 flex-shrink-0 rounded overflow-hidden">
            <img
              :src="getCoverUrl(manga)"
              alt=""
              class="w-full h-full object-cover" width="400" height="600" loading="lazy" decoding="async" />
          </div>
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {{ manga.title }}
              </h3>
              <p v-if="manga.description" class="text-gray-600 dark:text-gray-600 text-sm mb-2 line-clamp-2">
                {{ manga.description }}
              </p>
              <div class="flex flex-wrap gap-2 mb-2">
                <Tag v-if="manga.theme" :value="manga.theme" />
                <Tag v-if="manga.site" :value="manga.site" severity="secondary" />
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span v-if="manga.author" class="text-sm text-gray-600 dark:text-gray-600">
                <i class="pi pi-user mr-1" aria-hidden="true"></i>{{ manga.author }}
              </span>
              <div class="flex items-center gap-4">
                <span v-if="manga.lastChapter" class="flex items-center text-sm">
                  <i class="pi pi-book mr-1" aria-hidden="true"></i>
                  {{ (manga.type && manga.type.toString().toLowerCase() === 'anime') ? 'S'+manga.lastChapter.split('.')[0] + 'E'+manga.lastChapter.split('.')[1] : 'Ch.' + manga.lastChapter }}
                </span>
                <Tag v-if="manga.status" :value="manga.status" :severity="getStatusSeverity(manga.status)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="searchResults.length > 0" class="mt-8 flex justify-center">
        <Paginator
          :rows="itemsPerPage"
          :totalRecords="totalResults"
          :rowsPerPageOptions="[12, 24, 48]"
          @page="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script src="./Search.ts"></script>

<style scoped src="./Search.css"></style>
